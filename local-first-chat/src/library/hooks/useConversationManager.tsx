import { useCallback, useMemo } from 'react';
import { db } from '@/powersync/AppSchema';
import { useToast } from './use-toast';
import { ConversationContext } from '@/utils/Contexts';
import { useNavigate } from '@tanstack/react-router';

export type ConversationContextType = {
  handleDeleteConversation: (id: string, sideEffect?: () => any) => Promise<void>;
  handleNewConversation: (systemPrompt?: string | null, top_k?: number, temperature?: number) => Promise<string | undefined>;
  navigateToConversation: (convId: string, sideEffect?: () => any) => void;
};

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  // const supabase = useSupabase();
  const navigate = useNavigate();

  const navigationOptions = useMemo(() => ({
    search: {
      sidebar: 'open',
      conversationOptions: 'collapsed'
    }
  } as const), []);

  const navigateToConversation = useCallback((convId: string | null, sideEffect?: () => any) => {
    if (convId) {
      navigate({
        to: '/conversation/$id',
        params: { id: convId },
        ...navigationOptions
      });
    } else {
      navigate({
        to: '/conversation/newchat',
        ...navigationOptions
      });
    }
    if (sideEffect) {
      sideEffect();
    }
  }, [navigate, navigationOptions]);

  const handleDeleteConversation = useCallback(async (id: string, sideEffect?: () => any) => {
    try {
      await db.transaction().execute(async (trx) => {
        await trx.deleteFrom('conversation_messages')
          .where('id', '=', id.toString())
          .execute();

        await trx.deleteFrom('conversations')
          .where('id', '=', id.toString())
          .execute();

        const newCurrentConversation = await trx.selectFrom('conversations')
          .selectAll()
          .execute();

        if (newCurrentConversation.length > 0) {
          const newConvId = newCurrentConversation.at(-1)!.id;
          navigateToConversation(newConvId);
        } else {
          navigate({ to: '/conversation/newchat', search: { sidebar: 'open' } });
        }

        toast({
          title: "Conversation Deleted",
          description: "The conversation has been permanently deleted.",
        });

        if (sideEffect) {
          sideEffect();
        }
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete conversation.",
      });
    }
  }, [navigateToConversation]);

  const handleNewConversation = useCallback(async (systemPrompt: string | null = null, top_k = 10, temperature = 0.7) => {
    try {
      const now = new Date();
      // const user = await supabase?.client.auth.getUser();
      const result = await db.insertInto('conversations')
        .values({
          id: crypto.randomUUID(),
          name: 'New conversation',
          conversation_summary: '',
          system_prompt: systemPrompt!,
          created_at: now.toLocaleDateString(),
          updated_at: now.toLocaleDateString(),
          top_k,
          temperature,
          user_id:  'Local_ID'
        })
        .returning('id')
        .executeTakeFirst();

      const newConvId = result?.id ?? '0';
      navigateToConversation(newConvId);
      return newConvId;
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  }, [navigateToConversation]);

  const contextValue = useMemo(() => ({
    handleDeleteConversation,
    handleNewConversation,
    navigateToConversation
  }), [
    handleDeleteConversation,
    handleNewConversation,
    navigateToConversation
  ]);

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
}
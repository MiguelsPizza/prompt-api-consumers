import { useCallback, useLayoutEffect, useState, useEffect, useMemo, createContext, useContext } from 'react';
import { db } from '@/powersync/AppSchema';
import { useToast } from './use-toast';
import { useQuery } from '@powersync/react';
import { useSupabase, ConversationContext } from '@/utils/Contexts';
import { useNavigate } from '@tanstack/react-router';
import { Conversation } from '@/types/conversation';

export type ConversationContextType = {
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  setCurrentConversationId: (id: string | null) => void;
  conversations: Conversation[];
  handleDeleteConversation: (id: string, sideEffect?: () => any) => Promise<void>;
  handleNewConversation: (systemPrompt?: string | null, top_k?: number, temperature?: number) => Promise<string | undefined>;
};

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const supabase = useSupabase();
  const navigate = useNavigate();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);


  const { data: conversations } = useQuery(
    db.selectFrom('conversations')
      .selectAll()
      .orderBy('created_at', 'desc')
  );

  const currentConversation = currentConversationId !== null ?  conversations.find(convs => convs.id === currentConversationId) ?? null : null

  // Memoize the navigation options object
  const navigationOptions = useMemo(() => ({
    search: {
      sidebar: 'open',
      conversationOptions: 'collapsed'
    }
  } as const), []);

  // Optimize navigateToConversation
  const navigateToConversation = useCallback((convId: string | null) => {
    if(convId){
    navigate({
      to: '/conversation/$id',
      params: { id: convId },
      ...navigationOptions
    });
  } else{
    navigate({
      to: '/conversation/newchat',
      ...navigationOptions
    });
  }
  }, [navigate, navigationOptions]);

  // Remove the separate useEffect for navigation and combine with useLayoutEffect
  useLayoutEffect(() => {
    if (conversations?.length && !currentConversationId) {
      const conv = conversations.at(-1)!;
      setCurrentConversationId(conv.id);
      navigateToConversation(conv.id);
      return
    } else if (!currentConversationId || (conversations?.length === 0)
    ) {
      setCurrentConversationId(null)
      navigateToConversation(null);
    } else{
      navigateToConversation(currentConversationId)
    }
  }, [conversations?.length, currentConversationId, navigateToConversation]);


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
          setCurrentConversationId(newConvId);
          navigateToConversation(newConvId);
        } else {
          setCurrentConversationId(null);
          navigate({ to: '/conversation', search: { sidebar: 'open' } });
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
      const user = await supabase?.client.auth.getUser();
      const result = await db.insertInto('conversations')
        .values({
          id: crypto.randomUUID(),
          name: 'New conversation',
          conversation_summary: null,
          system_prompt: systemPrompt,
          created_at: now.toLocaleDateString(),
          updated_at: now.toLocaleDateString(),
          top_k,
          temperature,
          user_id: !user?.error ? user?.data.user.id : 'Local_ID'
        })
        .returning('id')
        .executeTakeFirst();

      const newConvId = result?.id ?? '0';
      setCurrentConversationId(newConvId);
      navigateToConversation(newConvId);
      return newConvId;
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  }, [navigateToConversation]);

  const contextValue = useMemo(() => ({
    currentConversationId,
    setCurrentConversationId,
    currentConversation,
    conversations,
    handleDeleteConversation,
    handleNewConversation,
  }), [
    currentConversationId,
    currentConversation,
    conversations,
    handleDeleteConversation,
    handleNewConversation
  ]);

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
}
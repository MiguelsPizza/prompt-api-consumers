import { useCallback, useMemo } from 'react';
import { useDrizzlePGlite } from '@/dataLayer';
import { conversations, conversation_messages } from '@/dataLayer/schema';
import { useToast } from './use-toast';
import { ConversationContext } from '@/utils/Contexts';
import { useNavigate } from '@tanstack/react-router';
import { eq } from 'drizzle-orm';

export interface ConversationContextType {
  handleDeleteConversation: (
    id: string,
    sideEffect?: () => any,
  ) => Promise<void>;
  handleNewConversation: (
    system_prompt?: string | null,
    top_k?: number,
    temperature?: number,
  ) => Promise<string | undefined>;
  navigateToConversation: (convId: string, sideEffect?: () => any) => void;
}

export function ConversationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const db = useDrizzlePGlite();
  // const supabase = useSupabase();
  const navigate = useNavigate();

  const navigationOptions = useMemo(
    () =>
      ({
        search: {
          sidebar: 'open',
          conversationOptions: 'collapsed',
        },
      }) as const,
    [],
  );

  const navigateToConversation = useCallback(
    (convId: string | null, sideEffect?: () => any) => {
      if (convId) {
        navigate({
          to: '/conversation/$id',
          params: { id: convId },
          ...navigationOptions,
        });
      } else {
        navigate({
          to: '/conversation/newchat',
          ...navigationOptions,
        });
      }
      if (sideEffect) {
        sideEffect();
      }
    },
    [navigate, navigationOptions],
  );

  const handleDeleteConversation = useCallback(
    async (id: string, sideEffect?: () => any) => {
      try {
        await db.transaction(async (tx) => {
          await tx
            .delete(conversation_messages)
            .where(eq(conversation_messages.id, id.toString()));

          await tx
            .delete(conversations)
            .where(eq(conversations.id, id.toString()));

          const newCurrentConversation = await tx.select().from(conversations);

          if (newCurrentConversation.length > 0) {
            const newConvId = newCurrentConversation.at(-1)!.id;
            navigateToConversation(newConvId);
          } else {
            navigate({
              to: '/conversation/newchat',
              search: { sidebar: 'open' },
            });
          }

          toast({
            title: 'Conversation Deleted',
            description: 'The conversation has been permanently deleted.',
          });

          if (sideEffect) {
            sideEffect();
          }
        });
      } catch (error) {
        console.error('Error deleting conversation:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete conversation.',
        });
      }
    },
    [navigateToConversation],
  );

  const handleNewConversation = useCallback(
    async (
      system_prompt: string | null = '',
      top_k = 10,
      temperature = 0.7,
    ) => {
      try {
        console.log({ system_prompt });
        const now = new Date();
        // const user = await supabase?.client.auth.getUser();
        const result = await db
          .insert(conversations)
          .values({
            id: crypto.randomUUID(),
            name: 'New conversation',
            conversation_summary: '',
            system_prompt: system_prompt,
            created_at: now.toLocaleDateString(),
            updated_at: now.toLocaleDateString(),
            top_k: top_k,
            temperature,
            user_id: 'Local_ID',
          })
          .returning({ id: conversations.id });

        const newConvId = result[0]?.id ?? '0';
        navigateToConversation(newConvId);
        return newConvId;
      } catch (error) {
        console.error('Error creating new conversation:', error);
      }
    },
    [navigateToConversation],
  );

  const contextValue = useMemo(
    () => ({
      handleDeleteConversation,
      handleNewConversation,
      navigateToConversation,
    }),
    [handleDeleteConversation, handleNewConversation, navigateToConversation],
  );

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
}

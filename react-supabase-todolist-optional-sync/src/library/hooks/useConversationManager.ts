import { useCallback, useLayoutEffect, useState } from 'react';
import { db } from '@/powersync/AppSchema'
import { useToast } from './use-toast';
import { useQuery } from '@powersync/react';
import { useSupabase } from '@/utils/Contexts';


export type HandlerNewConversationType = (systemPrompt?: string | null, top_k?: number, temperature?: number) => void;

export function useConversationManager() {
  const { toast } = useToast();
  const supabase = useSupabase()
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  //() => db.conversation.toArray()
  // Update conversations query
  const { data: conversations } = useQuery(db.selectFrom('conversations').selectAll()
  );

  // Update current conversation query
  const { data: [currentConversation] = [] } = useQuery(db.selectFrom('conversations')
    .selectAll()
    .where('id', '=', currentConversationId || '')
  );

  useLayoutEffect(() => {
    if (conversations?.length && !currentConversationId) {
      const conv = conversations.at(-1)!;
      setCurrentConversationId(conv.id);
    }
  }, [conversations?.length]);

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
          setCurrentConversationId(newCurrentConversation.at(-1)!.id);
        } else {
          setCurrentConversationId(null);
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
  }, []);

  const handleNewConversation: HandlerNewConversationType = useCallback(async (systemPrompt = null, top_k = 10, temperature = 0.7) => {
    try {
      const now = new Date();
      const user = await supabase?.client.auth.getUser()
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
          userId: !user?.error ? user?.data.user.id : 'Local_ID'
        })
        .returning('id')
        .executeTakeFirst();

      setCurrentConversationId(result?.id ?? '0');
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  }, []);


  return {
    currentConversationId,
    setCurrentConversationId,
    currentConversation,
    conversations,
    handleDeleteConversation,
    handleNewConversation,
  };
}
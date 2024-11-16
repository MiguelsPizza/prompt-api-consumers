import { useCallback, useLayoutEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../local-db/db';
import { useToast } from './use-toast';


export type HandlerNewConversationType =  (systemPrompt?: string | null, top_k?: number, temperature?: number) => void;

export function useConversationManager() {
  const { toast } = useToast();
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  const conversations = useLiveQuery(() => db.conversation.toArray());
  const currentConversation = useLiveQuery(
    async () => (currentConversationId ? await db.conversation.get(currentConversationId) : undefined),
    [currentConversationId]
  );

  useLayoutEffect(() => {
    if (conversations?.length && !currentConversationId) {
      const conv = conversations.at(-1)!;
      setCurrentConversationId(conv.id);
    }
  }, [conversations?.length]);

  const handleDeleteConversation = useCallback(async (id: number, sideEffect?: () => any) => {
    try {
      await db.conversationMessage.where('conversation').equals(id).delete();
      await db.conversation.delete(id);

      const newCurrentConversation = await db.conversation.toArray();
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
      const id = await db.conversation.add({
        name: 'New conversation',
        conversation_summary: null,
        system_prompt: systemPrompt,
        created_at: now,
        updated_at: now,
        top_k,
        temperature,
      });
      setCurrentConversationId(id);
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
import { useEffect, useState } from 'react';
import { ConversationMessage, db } from '../local-db/db';
import { useSummarizer } from 'use-prompt-api';
import { useLiveQuery } from 'dexie-react-hooks';

export function useConversationSummary(
  currentConversationId: number | null,
) {
  const [error, setError] = useState<string | null>(null);

  const { summarize, error: summarizerError } = useSummarizer({
    type: 'tl;dr',
    format: 'plain-text',
    length: 'short',
    sharedContext: "These are the initial messages in a conversation with an LLM",
  });

  const currentConversation = useLiveQuery(
    async () => {
      if (!currentConversationId) return null;
      return await db.conversation.get(currentConversationId);
    },
    [currentConversationId]
  );

  const conv = useLiveQuery(
    async () => {
      if (!currentConversationId) return [];
      return await db.conversationMessage
        .where('conversation')
        .equals(currentConversationId)
        .sortBy('position');
    },
    [currentConversationId]
  );

  async function updateConversationSummary(convId: number, messages: ConversationMessage[], abortController: AbortController) {
    const convString = messages.reduce(
      (acc, { content, role }) => acc + `${role}: ${content}\n`,
      ''
    );
    try {
      // Check if window.ai is available
      if (!window.ai?.languageModel) {
        throw new Error('Language model API is not available');
      }

      const convSummary = await summarize(convString, {
        streaming: false,
        signal: abortController.signal,
      });

      if (!convSummary) {
        throw new Error('Failed to generate conversation summary');
      }

      const headlineSession = await window.ai.languageModel.create({
        systemPrompt: `You take in a LLM conversation summary and generate a Title for it in this format
          $Title: (Title goes here)` // existing prompt
      });

      const res = await headlineSession.prompt(convSummary);
      headlineSession?.destroy()

      const title = res.slice(res.indexOf('$Title:'))

      await db.conversation.update(convId, { conversation_summary: title })

    } catch (error) {
      if (!abortController.signal.aborted) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Failed to generate or update summary:', error);
        setError(errorMessage);
      }
    }
  }

  useEffect(() => {
    if (currentConversationId === null || !currentConversation || !conv) return;
    if (conv.length <= 1 || currentConversation.conversation_summary !== null) return
    const abortController = new AbortController();
    setError(null);
    updateConversationSummary(currentConversationId, conv, abortController);
    return () => {
      abortController.abort();
    };
  }, [currentConversationId, conv?.length]);

  return {
    error: error || summarizerError || null
  };
}
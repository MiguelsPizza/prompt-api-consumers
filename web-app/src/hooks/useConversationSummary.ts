import { useEffect, useState } from 'react';
import { db } from '../local-db/db';
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

  const messages = useLiveQuery(
    async () => {
      if (!currentConversationId) return [];
      return await db.conversationMessage
        .where('conversation')
        .equals(currentConversationId)
        .sortBy('position');
    },
    [currentConversationId]
  );

  useEffect(() => {
    const abortController = new AbortController();
    setError(null); // Reset error state on each effect run

    async function updateConversationSummary() {
      if (currentConversationId === null || !currentConversation || !messages) {
        return;
      }

      if (messages.length > 1 && !currentConversation.conversation_summary) {
        const convString = messages.reduce(
          (acc, { content, role }) => acc + `${role}: ${content}\n`,
          ''
        );
        const convAtRequestTime = currentConversation.id;

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

          const headline = await window.ai.languageModel.create({
            systemPrompt: `You take in a summary...` // existing prompt
          });

          const res = await headline.prompt(convSummary);
          // ... existing headline extraction ...

        } catch (error) {
          if (!abortController.signal.aborted) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Failed to generate or update summary:', error);
            setError(errorMessage);
          }
        }
      }
    }

    updateConversationSummary();

    return () => {
      abortController.abort();
    };
  }, [currentConversationId, messages?.length]);

  return {
    error: error || summarizerError || null
  };
}
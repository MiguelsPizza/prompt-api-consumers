import { useEffect } from 'react';
import { db } from '../local-db/db';
import { useSummarizer } from 'use-prompt-api';
import { useLiveQuery } from 'dexie-react-hooks';

export function useConversationSummary(
  currentConversationId: number | null,
) {
  const { summarize } = useSummarizer({
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
    console.log('Starting conversation summary effect', { currentConversationId });

    async function updateConversationSummary() {
      if (currentConversationId === null || !currentConversation || !messages) {
        console.log('No conversation to summarize', { currentConversationId, currentConversation });
        return;
      }

      console.log('Retrieved messages for conversation', { messageCount: messages.length });

      if (messages.length > 1 && !currentConversation.conversation_summary) {
        console.log('Generating summary for conversation', { conversationId: currentConversation.id });
        const convString = messages.reduce(
          (acc, { content, role }) => acc + `${role}: ${content}\n`,
          ''
        );
        const convAtRequestTime = currentConversation.id;

        try {
          console.log('Calling summarize function');
          const convSummary = await summarize(convString, {
            streaming: false,
            signal: abortController.signal,
          });
          console.log('Generated conversation summary', { convSummary });

          console.log('Creating headline model');
          const headline = await window.ai.languageModel.create({
            systemPrompt: `You take in a summary of a conversation between a user and LLM and generate a short headline/description of the conversation.

            For example, if given this summary:
            "The user asked about React hooks and the LLM explained useEffect, useState and custom hooks with code examples"
            You would respond with:
            HEADLINE: React Hooks Tutorial and Examples

            You must format your response exactly like this:
            HEADLINE: <your headline here>`,
          });

          const res = await headline.prompt(convSummary!);
          console.log('Generated headline response', { res });
          const headlineMatch = res.match(/^HEADLINE:\s*(.+)$/m);
          const extractedHeadline = headlineMatch ? headlineMatch[1].trim() : res;
          console.log('Extracted headline', { extractedHeadline });

          if (extractedHeadline && convAtRequestTime === currentConversation.id) {
            console.log('Updating conversation with new summary', {
              conversationId: convAtRequestTime,
              summary: extractedHeadline
            });
            await db.conversation.update(convAtRequestTime, {
              conversation_summary: extractedHeadline,
            });
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            console.error('Failed to generate or update summary:', error);
          }
        }
      } else {
        console.log('Skipping summary generation', {
          messageCount: messages.length,
          hasSummary: !!currentConversation.conversation_summary
        });
      }
    }

    updateConversationSummary();

    return () => {
      console.log('Cleaning up conversation summary effect');
      abortController.abort();
    };
  }, [currentConversationId, messages?.length]);
}
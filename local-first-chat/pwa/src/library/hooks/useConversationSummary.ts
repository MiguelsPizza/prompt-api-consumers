import { useDrizzleLiveIncremental, useDrizzlePGlite } from '@/dataLayer';
import {
  ConversationMessage,
  conversations,
  ConversationWithRelations,
} from '@local-first-web-ai-monorepo/schema/cloud';
import { useSummarizer } from '@local-first-web-ai-monorepo/use-prompt-api';
import { eq } from 'drizzle-orm';
import { useEffect, useState } from 'react';

export function useConversationSummary(currentConversationId: string | null) {
  const db = useDrizzlePGlite();
  const [error, setError] = useState<string | null>(null);

  const { summarize, error: summarizerError } = useSummarizer({
    type: 'tl;dr',
    format: 'plain-text',
    length: 'short',
    sharedContext:
      'These are the initial messages in a conversation with an LLM',
  });

  const { data: currentConversation } = useDrizzleLiveIncremental('id', (db) =>
    db.query.conversations.findFirst({
      where: ({ id }, { eq }) => eq(id, currentConversationId ?? ''),
      with: {
        conversation_messages: {
          orderBy: (messages, { asc }) => [asc(messages.position)],
        },
      },
    }),
  );

  async function updateconversation_summary(
    convId: string,
    messages: ConversationMessage[],
    abortController: AbortController,
  ) {
    const convString = messages.reduce(
      (acc, { content, role }) => acc + `${role}: ${content}\n`,
      '',
    );
    try {
      if (!window.ai.languageModel) {
        throw new Error('Language model API is not available');
      }

      let convSummary: string;
      try {
        convSummary = (await summarize(convString, {
          streaming: false,
          signal: abortController.signal,
        })) as string;
      } catch (error) {
        // Fallback to regular session if summarize fails
        const fallbackSession = await window.ai.languageModel.create({
          systemPrompt:
            'Summarize the following conversation in a brief paragraph. Focus on the main topics and key points.',
        });
        convSummary = await fallbackSession.prompt(convString);
        fallbackSession.destroy();
      }

      if (!convSummary) {
        throw new Error('Failed to generate conversation summary');
      }

      if (!convSummary) {
        throw new Error('Failed to generate conversation summary');
      }

      const headlineSession = await window.ai.languageModel.create({
        systemPrompt: `You are a conversation title generator. Your job is to create concise, descriptive titles.

          Rules for generating titles:
          - Focus on the main topic or key insight
          - Use 3-7 words
          - Be specific but brief
          - No quotes or special characters
          - Must be in title case

          To generate a title, respond with:
          GENERATE_TITLE: Your Title Here

          Example input: "A discussion about React performance optimization and debugging techniques"
          Example response: "GENERATE_TITLE: React Performance Optimization Strategies"`,
      });

      const titleResponse = await headlineSession.prompt(convSummary);
      let titleMatch = /^GENERATE_TITLE:\s*(.+)$/i.exec(titleResponse);

      if (!titleMatch) {
        // If the format isn't correct, try one more time with a reminder
        const retryResponse = await headlineSession.prompt(
          'Please generate a title in the correct format: GENERATE_TITLE: Your Title Here',
        );
        const retryMatch = /^GENERATE_TITLE:\s*(.+)$/i.exec(retryResponse);
        if (!retryMatch) {
          throw new Error('Failed to generate properly formatted title');
        }
        titleMatch = retryMatch;
      }

      const title = titleMatch[1].trim();
      headlineSession.destroy();

      await db
        .update(conversations)
        .set({ conversation_summary: title })
        .where(eq(conversations.id, convId));
    } catch (error) {
      if (!abortController.signal.aborted) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Failed to generate or update summary:', error);
        setError(errorMessage);
      }
    }
  }

  useEffect(() => {
    if (shouldSkipSummary(currentConversation as ConversationWithRelations))
      return;
    const abortController = new AbortController();
    setError(null);
    updateconversation_summary(
      currentConversation!.id,
      currentConversation!.conversation_messages,
      abortController,
    );
    return () => {
      abortController.abort();
    };
  }, [
    currentConversationId,
    currentConversation?.conversation_messages.length,
  ]);

  return {
    error: error || summarizerError || null,
  };
}

const shouldSkipSummary = (currentConversation: ConversationWithRelations) => {
  if (
    !currentConversation ||
    !currentConversation.conversation_messages?.length
  ) {
    return true;
  }
  if (
    currentConversation.conversation_messages.length <= 2 ||
    currentConversation.conversation_summary !== null
  ) {
    return true;
  }
  return false;
};

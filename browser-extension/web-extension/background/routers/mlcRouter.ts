/* eslint-disable @typescript-eslint/no-floating-promises */
// mlcRouter.ts
// import { getEngine } from '../modelEngines/mlcEngine';
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm';
import { z } from 'zod';
// import { engine } from '..';
import { observable } from '@trpc/server/observable';
// import { getEngine } from '../modelEngines/mlcEngine';
import { ZAILanguageModelCreateOptions } from '@local-first-web-ai-monorepo/web-ai-polyfill';
import { ChatMessage } from '../../../lib/src/index';
import { SessionSchema, createSessionMessage } from '../lib/sessionSchema';
import { ZSupportedLLMModel } from '../lib/supportedModels';
import { t } from './trpcBase';

// Import your session manager + schema helpers
import {
  activeSessionItem,
  endSession,
  startSession
} from '../lib/sessionManager';

export const mlcRouter = t.router({
  // 1) Reload procedure - creates a new session in WXT & reloads the model
  create: t.procedure
    .input(
      z.object({
        modelId: ZSupportedLLMModel,
        chatOpts: ZAILanguageModelCreateOptions.optional(),
        requesterURL: z.union([z.string().url(), z.literal('popup'), z.literal('content-script')]),
        sessionId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input: { modelId, chatOpts, requesterURL, sessionId }, ctx }) => {
      console.log('[mlcRouter] Reloading model & creating new session:', modelId);

      // Reload the model engine with updated parameters
      const { temperature, topK, systemPrompt } = chatOpts || {};
      await ctx.chatEngine.reload(modelId, { temperature, top_p: topK });

      // Create or overwrite a new active session in WXT
      // If you prefer to ensure a truly new session each time, do so in startSession.
      const session = await startSession({
        sessionId: sessionId,
        llm_id: modelId,
        hostURL: requesterURL,
        systemPrompt: systemPrompt ?? '',
        temperature: temperature ?? 0.7,
        topK: topK ?? 40,
      });

      return { success: true, session };
    }),

  // 2) Non-streaming chat completion
  prompt: t.procedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        message: z.object({
          role: z.enum(['user']),
          content: z.string(),
        }),
      }),
    )
    .query(async ({ input, ctx }) => {
      console.log('[mlcRouter/chat] Adding user message & calling model:', input.sessionId);

      // Retrieve active session from WXT
      const activeSession = await activeSessionItem(input.sessionId).getValue();
      if (!activeSession) {
        throw new Error(`No active session found for ID: ${input.sessionId}`);
      }

      // Add user message to the session
      const nextPosition = (activeSession.initial_prompts?.length ?? 0) + 1;
      const userMessage = createSessionMessage(
        input.message.content,
        'user',
        activeSession,
        nextPosition
      );
      activeSession.initial_prompts = [
        ...(activeSession.initial_prompts ?? []),
        userMessage,
      ];

      // Save the updated session back to WXT
      const validatedSession = SessionSchema.parse(activeSession);
      await activeSessionItem(input.sessionId).setValue(validatedSession);

      // Build conversation to pass to the model
      const conversationHistory: ChatMessage[] = validatedSession.system_prompt
        ? [{ role: 'system', content: validatedSession.system_prompt }]
        : [];

      conversationHistory.push(
        ...validatedSession.initial_prompts.map((m) => ({
          role: m.role,
          content: m.content,
        }))
      );

      // Call the model
      const result = await ctx.chatEngine.chat.completions.create({
        stream: false,
        messages: conversationHistory,
      });

      console.log('[mlcRouter/chat] Model completion result:', result);
      return result;
    }),

  // 3) Clean up & archive the active session by storing to Dexie and removing from WXT
  destroy: t.procedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      console.log('[mlcRouter/archive] Archiving session:', input.sessionId);

      // This moves the session & messages into Dexie + removes from WXT
      await endSession(input.sessionId);

      return { success: true };
    }),

  // 4) Streaming chat completion (unchanged for example)
  promptStreaming: t.procedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        messages: z.array(
          z.object({
            role: z.enum(['system', 'user', 'assistant']),
            content: z.string(),
          }),
        ),
      }),
    )
    .subscription(({ input, ctx }) => {
      return observable<string>((emit) => {
        let isDone = false;

        (async () => {
          try {
            // "stream" is set to true, so we can iterate
            const completion = await ctx.chatEngine.chat.completions.create({
              stream: true,
              messages: input.messages as ChatCompletionMessageParam[],
            });

            let buffer = '';
            for await (const chunk of completion) {
              const piece = chunk.choices[0].delta.content ?? '';
              buffer += piece;
              emit.next(buffer);
            }
            isDone = true;
            emit.complete();
          } catch (err) {
            emit.error(err);
          }
        })();

        // Unsubscribe logic
        return async () => {
          if (!isDone && ctx.chatEngine) {
            // If you need to forcibly cancel the MLC stream, do so here
          }
        };
      });
    }),
});

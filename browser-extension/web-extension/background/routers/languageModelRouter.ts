import { ChatCompletionMessageParam } from '@mlc-ai/web-llm';
import { observable } from '@trpc/server/observable';
import { z } from 'zod';
import { ChatMessage } from '../../../lib/src/index';
import { t } from './trpcBase';

import { ZAILanguageModelCreateOptions } from '@local-first-web-ai-monorepo/web-ai-polyfill';
import { db } from '../lib/sessionArchiveDB';
import {
  getSessionFromDexie,
  startSession,
} from '../lib/sessionManager';
import {
  createSessionMessage
} from '../lib/sessionSchema';
import { ZSupportedLLMModel } from '../lib/supportedModels';

/**
 * mlcRouter:
 * Demonstrates how to handle LLM model reloading, chat prompting (sync and streaming),
 * and archiving sessions, now updated to use Dexie-based workflows directly.
 */
export const languageModelRouter = t.router({

  /**
   * 1) Reload procedure - creates a new session & reloads the model
   *    (Optionally overwriting previous session if you want to enforce unique session IDs).
   */
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
      console.log('[mlcRouter/create] Reloading model & creating new session:', modelId);

      // Reload the model engine with updated parameters
      const { temperature, topK, systemPrompt, initialPrompts } = chatOpts || {};
      await ctx.chatEngine.reload(modelId, {
        temperature: temperature ?? 0.7,
        top_p: topK ?? 40,
      });

      // Create a new session in Dexie
      const result = await startSession({
        sessionId,
        llm_id: modelId,
        hostURL: requesterURL,
        systemPrompt: systemPrompt ?? '',
        temperature: temperature ?? 0.7,
        topK: topK ?? 40,
        // @ts-expect-error Need to pick as SSoT for types
        initialPrompts: initialPrompts ?? [],
      });

      console.log('[mlcRouter/create] Created session:', result);
      return result;
    }),

  /**
   * 2) Non-streaming chat completion
   *
   *    - Fetches session from Dexie
   *    - Adds the user's message to DB
   *    - Gathers full conversation from DB
   *    - Invokes the LLM to get an assistant response
   *    - Inserts the assistant's message in DB
   *    - Returns the completion result
   */
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
    .mutation(async ({ input, ctx }) => {
      const { sessionId, message } = input;
      console.log('[mlcRouter/prompt] SessionID:', sessionId, 'User message:', message);

      // Ensure the session exists
      const session = await getSessionFromDexie(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found in Dexie.`);
      }

      // Reload the model with session's current temperature/top_k
      await ctx.chatEngine.reload(session.llm_id, {
        temperature: session.temperature,
        top_p: session.top_k,
      });

      // Get current message count to place the new user message at next position
      const messageCount = await db.session_messages
        .where('session_id')
        .equals(sessionId)
        .count();
      const userPosition = messageCount + 1;

      // Add user message to Dexie
      const userMessage = createSessionMessage(
        message.content,
        'user',
        session,
        userPosition
      );
      await db.session_messages.add(userMessage);

      // Gather history from Dexie
      const allMessages = await db.session_messages
        .where('session_id')
        .equals(sessionId)
        .sortBy('position');

      // Convert sessionMessages to ChatMessage array for LLM
      const conversationHistory: ChatMessage[] = allMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get the model's response
      const result = await ctx.chatEngine.chat.completions.create({
        stream: false,
        messages: conversationHistory,
      });

      // Basic error check
      if (!result?.choices?.[0]?.message?.content) {
        return { result: null, error: 'Model failed to respond' };
      }

      // Add assistant reply to Dexie
      const assistantPosition = userPosition + 1;
      const assistantMessage = createSessionMessage(
        result.choices[0].message.content,
        'assistant',
        session,
        assistantPosition
      );
      await db.session_messages.add(assistantMessage);

      // Update the session updated timestamp
      await db.sessions.update(session.id, { updated_at: new Date().toISOString() });

      return { result, error: null };
    }),

  /**
   * 3) Destroy (archive or fully remove) the session
   *
   *    - You can either do a full Dexie removal or a specialized utility
   *      if you want to actually "archive" the data.
   */
  destroy: t.procedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      console.log('[mlcRouter/destroy] Archiving session:', input.sessionId);

      // Example Dexie removal (hard delete)
      await db.session_messages.where('session_id').equals(input.sessionId).delete();
      await db.sessions.delete(input.sessionId);

      return { success: true };
    }),

  /**
   * 4) Streaming chat completion
   *
   *    - Similar to .prompt, but returns chunked responses as a subscription
   *    - Example of how you'd incorporate streaming from MLC's "completions.create({ stream: true })"
   *      and push partial updates back to the client.
   */
  promptStreaming: t.procedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        messages: z.array(
          z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
          }),
        ),
      }),
    )
    .subscription(({ input, ctx }) => {
      const { sessionId, messages } = input;
      console.log('[mlcRouter/promptStreaming] SessionID:', sessionId);

      return observable<string>((emit) => {
        let isDone = false;
        (async () => {
          try {
            // Ensure the session exists
            const session = await getSessionFromDexie(sessionId);
            if (!session) {
              throw new Error(`Session ${sessionId} not found in Dexie.`);
            }

            // Reload model with session config
            await ctx.chatEngine.reload(session.llm_id, {
              temperature: session.temperature,
              top_p: session.top_k,
            });

            // Start streaming
            const completion = await ctx.chatEngine.chat.completions.create({
              stream: true,
              messages: messages as ChatCompletionMessageParam[],
            });

            let buffer = '';
            for await (const chunk of completion) {
              const piece = chunk?.choices?.[0]?.delta?.content ?? '';
              buffer += piece;
              emit.next(buffer);
            }

            isDone = true;
            emit.complete();

            // Optionally, after stream ends, store the final assistant message in Dexie
            // ------------------------------------------------
            // const finalPosition = await db.session_messages
            //   .where('session_id').equals(session.id)
            //   .count() + 1;
            // const assistantMessage = createSessionMessage(buffer, 'assistant', session, finalPosition);
            // await db.session_messages.add(assistantMessage);
            // await db.sessions.update(session.id, { updated_at: new Date().toISOString() });
            // ------------------------------------------------
          } catch (err) {
            console.error('[mlcRouter/promptStreaming] Error:', err);
            emit.error(err);
          }
        })();

        // Graceful cleanup if unsubscribed early
        return () => {
          // If your MLC engine supports a force-cancel, do that here
          if (!isDone && ctx.chatEngine) {
            console.log('[mlcRouter/promptStreaming] Unsubscribing early...');
          }
        };
      });
    }),
});
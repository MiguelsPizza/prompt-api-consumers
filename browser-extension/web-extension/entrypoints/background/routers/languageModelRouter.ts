import { InitProgressReport } from '@mlc-ai/web-llm';
import { observable } from '@trpc/server/observable';
import { z } from 'zod';
import { t } from './trpcBase';

import { ZAILanguageModelCreateOptions } from '@local-first-web-ai-monorepo/web-ai-polyfill';
import { UUID } from 'crypto';
import { initModel } from '../lib/modelUtils';
import { db } from '../lib/sessionArchiveDB';
import {
  addUserMessageAndGetHistory,
  startSession
} from '../lib/sessionManager';
import {
  createSessionMessage
} from '../lib/sessionSchema';
import { ZSupportedLLMModel } from '../lib/supportedModels';
import { ee } from '../EventEmmiter';

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

      initModel(ctx.chatEngine, modelId, {
        temperature: temperature ?? 0.7,
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
        messages: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })),
      }),
    )
    .mutation(async ({ input, ctx, }) => {
      const { sessionId, messages } = input;
      console.log('[mlcRouter/prompt] SessionID:', sessionId, 'User message:', messages);

      // Use the helper function to process the incoming user message
      const { session, conversationHistory, insertIndex } = await addUserMessageAndGetHistory(ctx.chatEngine, sessionId, messages, ctx.keeper);

      // Invoke the LLM for a non-streaming response
      const result = await ctx.chatEngine.chat.completions.create({
        stream: false,
        messages: conversationHistory,
      });

      // Basic error check
      if (!result?.choices?.[0]?.message?.content) {
        return { result: null, error: 'Model failed to respond' };
      }

      // Add assistant reply to Dexie
      const assistantPosition = insertIndex
      const assistantMessage = createSessionMessage(
        result.choices[0].message.content,
        'assistant',
        session,
        assistantPosition
      );
      await db.session_messages.add(assistantMessage);

      // Update the session's updated timestamp
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
    .mutation(async ({ input, ctx }) => {
      console.log('[mlcRouter/destroy] Archiving session:', input.sessionId);
      ee.emit('destroy', input.sessionId as UUID)
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
        messages: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })),
      }),
    )
    .subscription(({ input, ctx }) => {
      const { sessionId, messages } = input;
      console.log('[mlcRouter/promptStreaming] SessionID:', sessionId, 'User message:', messages);

      return observable<string>((emit) => {
        let isDone = false;
        (async () => {
          ee.on('destroy', (id) => {
            if (id === sessionId) isDone = true
          })
          try {
            // Use the helper function to process the incoming user message
            const { session, conversationHistory, insertIndex } = await addUserMessageAndGetHistory(ctx.chatEngine, sessionId, messages, ctx.keeper);
            // Start streaming the response from the model
            const completion = await ctx.chatEngine.chat.completions.create({
              stream: true,
              messages: conversationHistory,
            });
            let buffer = '';
            // weird design choice for the prompt api TODO: Consider moving this accumulation to the
            for await (const chunk of completion) {
              const piece = chunk?.choices?.[0]?.delta?.content ?? '';
              buffer += piece;
              // update the stream indexed db
              emit.next(piece);
            }

            const assistantPosition = insertIndex
            const assistantMessage = createSessionMessage(buffer, 'assistant', session, assistantPosition);
            const streamMessageId = await db.session_messages.add(assistantMessage);

            isDone = true;
            // After stream completes, store the final assistant message in Dexie
            await db.sessions.update(session.id, { updated_at: new Date().toISOString() });

            emit.complete();
          } catch (err) {
            console.error('[mlcRouter/promptStreaming] Error:', err);
            emit.error(err);
          }
        })();

        // Graceful cleanup if unsubscribed early
        return () => {
          if (!isDone && ctx.chatEngine) {
            console.log('[mlcRouter/promptStreaming] Unsubscribing early...');
          }
        };
      });
    }),
  //This will not emit events and will instead expect you to listen to updates from one of the session wide subscriptions
  _promptStreamingInternal: t.procedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        messages: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { sessionId, messages } = input;
      console.log('[mlcRouter/promptStreaming] SessionID:', sessionId, 'User message:', messages);

      let isDone = false;
      // Use the helper function to process the incoming user message
      const { session, conversationHistory, insertIndex } = await addUserMessageAndGetHistory(ctx.chatEngine, sessionId, messages, ctx.keeper);
      let buffer = '';
      const assistantPosition = insertIndex
      const assistantMessage = createSessionMessage(buffer, 'assistant', session, assistantPosition);
      const streamMessageId = await db.session_messages.add(assistantMessage);
      // Start streaming the response from the model
      const completion = await ctx.chatEngine.chat.completions.create({
        stream: true,
        messages: conversationHistory,
      });


      // weird design choice for the prompt api TODO: Consider moving this accumulation to the
      for await (const chunk of completion) {
        const piece = chunk?.choices?.[0]?.delta?.content ?? '';
        buffer += piece;
        // update the stream indexed db
        await db.session_messages.update(streamMessageId, { ...assistantMessage, content: buffer });
      }

      isDone = true;
      // After stream completes, store the final assistant message in Dexie
      await db.sessions.update(session.id, { updated_at: new Date().toISOString() });

    }),

  downloadProgress: t.procedure
    .subscription(({ ctx }) => {
      // We return an observable that listens for "progress" events
      // emitted by the 'ee' and then emits them to the subscriber
      return observable<InitProgressReport>((emit) => {
        function handleProgress(progressEvent: InitProgressReport) {
          emit.next(progressEvent);
        }

        // Attach the listener
        const unsub = storage.watch<InitProgressReport>("session:progress", (newProgress) => handleProgress(newProgress!))

        // Cleanup when unsubscribed
        return () => {
          unsub()
        };
      });
    }),
});
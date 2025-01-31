import { observable } from '@trpc/server/observable';
import { liveQuery } from 'dexie';
import { z } from 'zod';
import { t } from './trpcBase';

import { ZAILanguageModelCreateOptionsWithSystemPrompt } from '@local-first-web-ai-monorepo/web-ai-polyfill';
import { db } from '../lib/sessionArchiveDB';
import {
  getSessionFromDexie,
  getSessionFromDexieWMessages,
  startSession,
} from '../lib/sessionManager';
import { BaseSession, SessionMessage, SessionSchema } from '../lib/sessionSchema';
import { ZSupportedLLMModel } from '../lib/supportedModels';

/**
 * sessionRouter:
 * A trpc router that provides CRUD and observable (live) queries
 * for sessions stored in IndexedDB (using Dexie).
 */
export const sessionRouter = t.router({
  /**
   * All sessions (simple query).
   * Retrieves an array of session objects from Dexie.
   */
  all: t.procedure.query(async () => {
    const sessions = await db.sessions.toArray();
    return sessions;
  }),

  /**
   * Live subscription to all sessions.
   * Whenever the Dexie table changes, we emit an updated array of sessions.
   */
  allLive: t.procedure.subscription(() => {
    return observable<BaseSession[]>((emit) => {
      // Dexie liveQuery will automatically re-run this query
      // whenever sessions table data changes.
      const subscription = liveQuery(() => db.sessions.toArray()).subscribe({
        next: (val) => emit.next(val),
        error: (err) => emit.error(err),
      });

      // Cleanup when unsubscribed
      return () => subscription.unsubscribe();
    });
  }),

  /**
   * Retrieve a single session without messages
   */
  getSession: t.procedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input: { sessionId } }) => {
      const session = await getSessionFromDexie(sessionId);
      return { session };
    }),

  /**
   * Retrieve a single session with its messages
   */
  getSessionWithMessages: t.procedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input: { sessionId } }) => {
      const { session, messages } = await getSessionFromDexieWMessages(sessionId);
      return { session, messages };
    }),

  /**
   * Live subscription to a specific session (with its messages).
   * Whenever Dexie sees a change in the specified session or messages,
   * we re-run the query and re-emit a new value.
   */
  sessionLive: t.procedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .subscription(({ input }) => {
      return observable<{
        session: BaseSession | null;
        messages: SessionMessage[] | null;
      }>((emit) => {
        const { sessionId } = input;

        // Wrap your query in liveQuery so it re-runs on changes
        const subscription = liveQuery(async () => {
          const session = await db.sessions.get(sessionId);
          if (!session) {
            return { session: null, messages: null };
          }
          const messages = await db.session_messages
            .where('session_id')
            .equals(sessionId)
            .sortBy('position');
          return { session, messages };
        }).subscribe({
          next: (val) => emit.next(val),
          error: (err) => emit.error(err),
        });

        return () => subscription.unsubscribe();
      });
    }),

  /**
   * Create or start a new session.
   * This calls your startSession(...) helper to initialize
   * the session in Dexie and return the result.
   */
  create: t.procedure
    .input(
      ZAILanguageModelCreateOptionsWithSystemPrompt.extend({
        // Allowed custom fields for session creation
        sessionId: z.string().uuid().optional(),
        name: z.string().optional(),
        hostURL: z.union([z.literal('popup'), z.literal('content-script'), z.string().url()]),
        llm_id: ZSupportedLLMModel,
      })
    )
    .mutation(async ({ input }) => {
      // Validate your data with zod + pass to startSession
      const result = await startSession(input);
      // For convenience, return the raw Dexie transaction result:
      return result;
    }),

  /**
   * Update or rename a session (basic example).
   * It's an optional demonstration of how you'd do partial updates.
   */
  update: t.procedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        // For demonstration, we allow updating just the session "name".
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const session = await getSessionFromDexie(input.sessionId)
      // Merge any fields you want to update
      const updatedSession: BaseSession = {
        ...session,
        ...input, // merges "name" if provided
        updated_at: new Date().toISOString(),
      };

      // Validate with your SessionSchema
      SessionSchema.parse(updatedSession);
      await db.sessions.put(updatedSession);

      return updatedSession;
    }),

  /**
   * Destroy a session (archive or remove from Dexie).
   * This calls your existing session manager code or Dexie directly.
   */
  destroy: t.procedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { sessionId } = input;

      // Use a transaction to ensure both deletes succeed or fail together
      await db.transaction('rw', db.sessions, db.session_messages, async () => {
        await db.session_messages.where('session_id').equals(sessionId).delete();
        await db.sessions.delete(sessionId);
      });

      return { success: true, sessionId };
    }),
});
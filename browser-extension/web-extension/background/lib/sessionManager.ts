import { ZAILanguageModelCreateOptionsWithSystemPrompt } from '@local-first-web-ai-monorepo/web-ai-polyfill';
import { z } from 'zod';
import { db } from './sessionArchiveDB';
import { BaseSession, createSessionMessage, SessionSchema } from './sessionSchema';
import { SupportedLLMModel } from './supportedModels';

// /**
//  * Helper to define an active session item in local (WXT) storage.
//  */
// export function activeSessionItem(sessionId: string) {
//   return storage.defineItem<Session | null>(
//     `local:activeSession:${sessionId}`,
//     { fallback: null }
//   );
// }

/**
 * A) Start a new session in WXT storage (active usage).
 *    1) Generate session + (optional) initial messages
 *    2) Store them in WXT as an ActiveSession
 */
export async function startSession({
  sessionId,
  name,
  hostURL,
  llm_id,
  systemPrompt,
  initialPrompts = [],
  temperature = 0.7,
  topK = 40,
}: z.infer<typeof ZAILanguageModelCreateOptionsWithSystemPrompt> & {
  sessionId?: string;
  name?: string;
  hostURL: string;
  llm_id: SupportedLLMModel;
}) {
  const now = new Date();
  const nowISO = now.toISOString();
  const nowLocale = now.toLocaleString();

  // If no sessionId provided, generate one
  const finalSessionId = sessionId || crypto.randomUUID();

  // Construct the "Session" object
  const newSessionBase: BaseSession = {
    id: finalSessionId,
    name: name ?? `Chat ${nowLocale}`,
    hostURL,
    llm_id,
    created_at: nowISO,
    updated_at: nowISO,
    temperature,
    system_prompt: systemPrompt,
    top_k: topK
  };

  const parse_initial_prompts = initialPrompts.map(({ content, role }, index) => createSessionMessage(content, role, newSessionBase, index))



  const session = SessionSchema.parse({
    ...newSessionBase,
    initial_prompts: parse_initial_prompts
  })

  const transRes = await db.transaction('rw', db.sessions, db.session_messages, async () => {

    //
    // Transaction Scope
    //

    const newSession = await db.sessions.add(newSessionBase);
    const newSessionMessages = await db.session_messages.bulkAdd(parse_initial_prompts)
    return { newSession, newSessionMessages }
  })

  // Validate with Zod and store in WXT
  // await activeSessionItem(finalSessionId).setValue(session);

  return transRes;
}

/**
 * B) End a session:
 *    1) Read active session from WXT
 *    2) Move session + messages to Dexie (long-term storage)
 *    3) Remove from WXT
 */
// export async function endSession(sessionId: string) {
//   // Grab the active session (type "Session") from WXT
//   const activeSession = await activeSessionItem(sessionId).getValue();
//   if (!activeSession) {
//     throw new Error(`No active session found in WXT for id ${sessionId}`);
//   }

//   // 1) Upsert the session itself into Dexie (db.sessions)
//   await db.sessions.put(activeSession);

//   // 2) Upsert all messages (whether "initial_prompts" or otherwise).
//   //    Currently, your "SessionSchema" only tracks initial_prompts. If you
//   //    later accumulate more messages, remember to store them there as well.
//   const allMessages = activeSession.initial_prompts ?? [];
//   if (allMessages.length > 0) {
//     await db.session_messages.bulkPut(allMessages);
//   }
//   await storage.removeItem(`local:${sessionId}`)
// }

/**
 * C) Restore a session from Dexie into WXT:
 *    1) Fetch session + messages from Dexie
 *    2) Write them to WXT as an active session
 */
export async function getSessionFromDexie(sessionId: string): Promise<BaseSession> {
  // 1) Fetch the session (BaseSession) from Dexie
  const session = await db.sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session with id ${sessionId} not found in Dexie.`);
  }


  return session
}


/**
 * C) Restore a session from Dexie into WXT:
 *    1) Fetch session + messages from Dexie
 *    2) Write them to WXT as an active session
 */
export async function getSessionFromDexieWMessages(sessionId: string) {
  // 1) Fetch the session (BaseSession) from Dexie
  const session = await getSessionFromDexie(sessionId)

  // 2) Get all messages that belong to this session
  const messages = await db.session_messages.where('session_id').equals(sessionId).toArray();


  return { session, messages };
}
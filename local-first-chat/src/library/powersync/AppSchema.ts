import { Kysely } from 'kysely';
import { PGliteWorker } from '@electric-sql/pglite/worker';
import { PgliteDialect } from '@soapbox/kysely-pglite';
import { live } from "@electric-sql/pglite/live"
import PGWorker from './db/worker.ts?worker'


// Define table interfaces
interface Conversations {
  id: string;
  name: string;
  conversation_summary: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
  top_k: number;
  temperature: number;
  user_id: string;
}

interface ConversationMessages {
  id: string;
  conversation_id: string;
  position: number;
  role: string;
  content: string;
  created_at: string;
  updated_at: string;
  temperature_at_creation: number;
  top_k_at_creation: number;
  user_id: string;
}

// Define Database interface
interface Database {
  conversations: Conversations;
  conversation_messages: ConversationMessages;
}

// Initialize PGlite worker and Kysely
export const pglite = await new PGliteWorker(
  new PGWorker({ name: 'pglite-worker' }), { extensions: { live } }
);

export const db = new Kysely<Database>({
  dialect: new PgliteDialect({ database: pglite }),
});
// Export types
export type ConversationType = Database['conversations'];
export type ConversationMessageType = Database['conversation_messages'];

// Schema switching functions
export async function switchToSyncedSchema(userId: string) {
  try {
    console.log('Starting sync process for user:', userId);

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('conversations')
        .set({ user_id: userId })
        .where('user_id', 'is', null)
        .execute();

      await trx
        .updateTable('conversation_messages')
        .set({ user_id: userId })
        .where('user_id', 'is', null)
        .execute();
    });

  } catch (error) {
    console.error('Sync process failed:', error);
    throw error;
  }
}

export async function switchToLocalSchema() {
  // No-op for PGlite as it's always local
}
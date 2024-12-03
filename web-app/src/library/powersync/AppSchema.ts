import {
  column,
  Schema,
  Table,
  PowerSyncDatabase,
  ColumnsType,
  TableV2Options
} from '@powersync/web';
import { wrapPowerSyncWithKysely } from "@powersync/kysely-driver";
import { setSyncEnabled } from './SyncMode';

export const DB_NAME = 'chat_database.db';

// Define table names as const to prevent typos
export const TableNames = {
  CONVERSATIONS: 'conversations',
  CONVERSATION_MESSAGES: 'conversation_messages',
} as const;

type TableDefinition = {
  name: string,
  columns: ColumnsType
  options: TableV2Options
}

// Define table schemas with 'as const' and type satisfaction
export const conversationTableDef = {
  name: 'conversations',
  columns: {
    id: column.text,
    name: column.text,
    conversation_summary: column.text,
    system_prompt: column.text,
    created_at: column.text,
    updated_at: column.text,
    top_k: column.real,
    temperature: column.real,
    user_id: column.text
  },
  options: {
    indexes: {
      user: ['user_id'],
      updated: ['updated_at'],  // For sorting conversations by last update
      user_updated: ['user_id', 'updated_at']  // For efficiently fetching user's conversations sorted by time
    }
  }
} as const satisfies TableDefinition;

export const conversationMessagesTableDef = {
  name: 'conversation_messages',
  columns: {
    id: column.text,
    conversation_id: column.text,
    position: column.integer,
    role: column.text,
    content: column.text,
    created_at: column.text,
    updated_at: column.text,
    temperature_at_creation: column.real,
    top_k_at_creation: column.real,
    user_id: column.text
  },
  options: {
    indexes: {
      conversation: ['conversation_id'],
      position: ['position'],
      conv_position: ['conversation_id', 'position'],  // For efficiently fetching ordered messages
      created: ['created_at'],  // For time-based queries
      user_created: ['user_id', 'created_at']  // For user's message history
    }
  }
} as const satisfies TableDefinition;

// Initialize database with schema
export let AppSchema = new Schema({
  conversations: new Table(
    conversationTableDef.columns, conversationTableDef.options
  ),
  conversation_messages: new Table(
    conversationMessagesTableDef.columns, conversationMessagesTableDef.options,
  ),
});
export let powerSyncDb = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: DB_NAME
  }
});
console.log({ db: powerSyncDb.schema })
// Create type-safe Kysely instance
export type Database = (typeof AppSchema)['types'];
export let db = wrapPowerSyncWithKysely<Database>(powerSyncDb);

// Schema switching function
export async function switchToSyncedSchema(userId: string) {
  try {
    console.log('Starting sync process for user:', userId);

    // Update sync setting
    setSyncEnabled(true);

    // Update existing records with user_id
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

// Switch to local schema
export async function switchToLocalSchema() {
  setSyncEnabled(false);
}

// Export types inferred from schema
export type ConversationType = Database['conversations'];
export type ConversationMessageType = Database['conversation_messages'];
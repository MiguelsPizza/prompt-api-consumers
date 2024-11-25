import {
  AbstractPowerSyncDatabase,
  Column,
  column,
  Schema,
  Table,
  PowerSyncDatabase,
  ColumnsType,
  TableV2Options
} from '@powersync/web';
import { Kysely, wrapPowerSyncWithKysely } from "@powersync/kysely-driver";
import { setSyncEnabled } from './SyncMode';
import { sql } from 'drizzle-orm';

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
    userId: column.text
  },
  options: {
    indexes: { user: ['userId'] }
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
    userId: column.text
  },
  options: {
    indexes: {
      conversation: ['conversation_id'],
      position: ['position']
    }
  }
} as const satisfies TableDefinition;

// Helper function to generate view names
const getViewName = (table: string, synced: boolean): string =>
  synced ? table : `inactive_synced_${table}`;

const getLocalViewName = (table: string, synced: boolean): string =>
  synced ? `inactive_local_${table}` : table;

// Schema creation function
export function makeSchema(synced: boolean) {
  return new Schema({
    conversations: new Table(
      conversationTableDef.columns,
      {
        ...conversationTableDef.options,
        viewName: getViewName(conversationTableDef.name, synced)
      }
    ),
    local_conversations: new Table(
      conversationTableDef.columns,
      {
        ...conversationTableDef.options,
        localOnly: true,
        viewName: getLocalViewName(conversationTableDef.name, synced)
      }
    ),
    conversation_messages: new Table(
      conversationMessagesTableDef.columns,
      {
        ...conversationMessagesTableDef.options,
        viewName: getViewName(conversationMessagesTableDef.name, synced)
      }
    ),
    local_conversation_messages: new Table(
      conversationMessagesTableDef.columns,
      {
        ...conversationMessagesTableDef.options,
        localOnly: true,
        viewName: getLocalViewName(conversationMessagesTableDef.name, synced)
      }
    )
  });
}

// Initialize database with schema
export const AppSchema = makeSchema(false);
export const powerSyncDb = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: DB_NAME
  }
});

// Create type-safe Kysely instance
export type Database = (typeof AppSchema)['types'];
export const db = wrapPowerSyncWithKysely<Database>(powerSyncDb);

// Schema switching function
export async function switchToSyncedSchema(db: Kysely<Database>, userId: string) {
  await powerSyncDb.updateSchema(makeSchema(true));
  setSyncEnabled(powerSyncDb.database.name, true);

  // Perform the migration in a transaction
  await db.transaction().execute(async (trx) => {
    // Migrate conversations
    await trx
      .insertInto('conversations')
      .columns([
        'id',
        'name',
        'conversation_summary',
        'system_prompt',
        'created_at',
        'updated_at',
        'top_k',
        'temperature',
        'userId'
      ])
      .expression(
        (qb) => qb
          .selectFrom('inactive_local_conversations')
          .select([
            'id',
            'name',
            'conversation_summary',
            'system_prompt',
            'created_at',
            'updated_at',
            'top_k',
            'temperature',
            sql<string>`${userId}`.as('userId')
          ])
      )
      .execute();

    // Migrate messages
    await trx
      .insertInto('conversation_messages')
      .columns([
        'id',
        'conversation_id',
        'position',
        'role',
        'content',
        'created_at',
        'updated_at',
        'temperature_at_creation',
        'top_k_at_creation',
        'userId'
      ])
      .expression(
        (qb) => qb
          .selectFrom('inactive_local_conversation_messages')
          .select([
            'id',
            'conversation_id',
            'position',
            'role',
            'content',
            'created_at',
            'updated_at',
            'temperature_at_creation',
            'top_k_at_creation',
            sql<string>`${userId}`.as('userId')
          ])
      )
      .execute();

    // Clean up local tables
    await trx
      .deleteFrom('inactive_local_conversation_messages')
      .execute();

    await trx
      .deleteFrom('inactive_local_conversations')
      .execute();
  });
}

// Switch to local schema
export async function switchToLocalSchema(db: AbstractPowerSyncDatabase) {
  await db.updateSchema(makeSchema(false));
  setSyncEnabled(db.database.name, false);
}

// Export types inferred from schema
export type ConversationType = Database['conversations'];
export type ConversationMessageType = Database['conversation_messages'];
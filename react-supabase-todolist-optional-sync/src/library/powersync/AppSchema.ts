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
    user_id: column.text
  },
  options: {
    indexes: { user: ['user_id'] }
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
export let AppSchema = makeSchema(false);
export let powerSyncDb = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: DB_NAME
  }
});
console.log({db: powerSyncDb.schema})
// Create type-safe Kysely instance
export type Database = (typeof AppSchema)['types'];
export let db = wrapPowerSyncWithKysely<Database>(powerSyncDb);

// Schema switching function
export async function switchToSyncedSchema(userId: string) {
  try {
    console.log('Starting schema switch process for user:', userId);
    // Update schema
    console.log('Updating PowerSync schema to synced mode...');
    try {
      AppSchema = makeSchema(true)
      await powerSyncDb.updateSchema(AppSchema);
      db = wrapPowerSyncWithKysely<(typeof AppSchema)['types']>(powerSyncDb);
      console.log('db',powerSyncDb.schema)
      console.log('Schema successfully updated to synced mode');
    } catch (error) {
      console.error('Failed to update schema:', error);
      throw error;
    }

    // Update sync setting
    try {
      setSyncEnabled(true);
      console.log('Sync mode enabled in local storage');
    } catch (error) {
      console.error('Failed to set sync enabled:', error);
      throw error;
    }

    // Perform the migration in a transaction
    console.log('Starting data migration transaction...');
    try {
      await db.transaction().execute(async (trx) => {
        // Migrate conversations
        console.log('Starting conversation migration...');
        try {
          const conversationResult = await trx
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
            'user_id'
          ])
          .expression((qb) =>
            qb.selectFrom('local_conversations')
            .select(({ eb }) => [
              'id',
              'name',
              'conversation_summary',
              'system_prompt',
              'created_at',
              'updated_at',
              'top_k',
              'temperature',
              eb.val(userId).as('user_id')  // Use expression builder to create a constant value
            ])
          )
          .execute();
          console.log('Conversations migrated successfully, affected rows:', conversationResult.length || 0);
        } catch (error) {
          console.error('Failed to migrate conversations:', error);
          throw error;
        }

        // Migrate messages
        console.log('Starting message migration...');
        try {
          const messageResult = await trx
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
            'user_id'
          ])
          .expression((qb) =>
            qb.selectFrom('local_conversation_messages')
            .select(({ eb }) => [
              'id',
              'conversation_id',
              'position',
              'role',
              'content',
              'created_at',
              'updated_at',
              'temperature_at_creation',
              'top_k_at_creation',
              eb.val(userId).as('user_id')  // Use expression builder to create a constant value
            ])
          )
          .execute();
          console.log('Messages migrated successfully, affected rows:', messageResult.length || 0);
        } catch (error) {
          console.error('Failed to migrate messages:', error);
          throw error;
        }

        // Clean up local tables
        console.log('Starting cleanup of local tables...');
        try {
          const messageCleanupResult = await trx
            //@ts-ignore
            .deleteFrom('inactive_local_conversation_messages')
            .execute();
          console.log('Cleaned up local messages, rows deleted:', messageCleanupResult.length || 0);

          const conversationCleanupResult = await trx
            //@ts-ignore
            .deleteFrom('inactive_local_conversations')
            .execute();
          console.log('Cleaned up local conversations, rows deleted:', conversationCleanupResult.length || 0);
        } catch (error) {
          console.error('Failed to clean up local tables:', error);
          throw error;
        }
      });
      console.log('Migration transaction completed successfully');
    } catch (error) {
      console.error('Migration transaction failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Schema switch failed:', error);
    throw error;
  }
}

// Switch to local schema
export async function switchToLocalSchema(db: AbstractPowerSyncDatabase) {
  await db.updateSchema(makeSchema(false));
  setSyncEnabled(false);
}

// Export types inferred from schema
export type ConversationType = Database['conversations'];
export type ConversationMessageType = Database['conversation_messages'];
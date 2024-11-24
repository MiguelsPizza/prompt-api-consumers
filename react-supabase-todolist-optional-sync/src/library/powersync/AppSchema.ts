import { AbstractPowerSyncDatabase, Column, column, ColumnsType, Schema, Table, TableV2Options } from '@powersync/web';
import { setSyncEnabled } from './SyncMode';

/**
 * This schema design supports a local-only to sync-enabled workflow by managing data
 * across two versions of each table: one for local-only use without syncing before a user registers,
 * the other for sync-enabled use after the user registers/signs in.
 *
 * This is done by utilizing the viewName property to override the default view name
 * of a table.
 *
 * See the README for details.
 *
 * `switchToSyncedSchema()` copies data from the local-only tables to the sync-enabled tables
 * so that it ends up in the upload queue.
 *
 */

import { PowerSyncDatabase } from '@powersync/web';
import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { isNull, relations } from "drizzle-orm";
import Drizzle, { real, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const DB_NAME = 'chat_database.db'
// const generatePowerSyncAndDrizzleSchema = <T extends ColumnsType>(tableName: string, schema: T, powersyncOptions: Omit<TableV2Options, 'viewName'> = {}) => {
//   // const test = Drizzle['integer'].call(this, 'test')
//   //@ts-ignore
//   const test = Object.entries(schema).map(([key, value]) => ([key, Drizzle[value.type!.toLocaleLowerCase()].call(this, key)]))
//   const drizzleSchema = sqliteTable(tableName, test)
//   const powersyncTable = new Table(schema, { viewName: tableName, ...powersyncOptions })
//   return [drizzleSchema, powersyncTable ]
// }

// const [drizzle, powsery] = generatePowerSyncAndDrizzleSchema('hello', {
//   name: column.text,
//   conversation_summary: column.text,
//   system_prompt: column.text,
//   created_at: column.text, // PowerSync uses text for dates
//   updated_at: column.text,
//   top_k: column.real,
//   temperature: column.real
// }, {localOnly: true})
// Create schema
export const AppSchema = makeSchema(false);

// Type definitions
export type Database = (typeof AppSchema)['types'];
export type ConversationType = Database['conversationsSchema'];
export type ConversationMessageType = Database['conversationMessagesSchema'];


// Define Drizzle tables
export const conversations = sqliteTable("conversations", {
  id: text("id"),
  name: text("name"),
  conversation_summary: text("conversation_summary"),
  system_prompt: text("system_prompt"),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
  top_k: real("top_k"),
  temperature: real("temperature"),
  userId: text("userId")
});

export const conversationMessages = sqliteTable("conversation_messages", {
  id: text("id"),
  conversation_id: text("conversation_id"),
  position: integer("position"),
  role: text("role"),
  content: text("content"),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
  temperature_at_creation: real("temperature_at_creation"),
  top_k_at_creation: real("top_k_at_creation"),
  userId: text("userId")
});


// Define relations
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(conversationMessages)
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationMessages.conversation_id],
    references: [conversations.id],
  })
}));

export const drizzleSchema = {
  conversations,
  conversationMessages,
  conversationsRelations,
  conversationMessagesRelations
} as const;

// Initialize PowerSync database
export const powerSyncDb = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: DB_NAME
  }
});

// Wrap with Drizzle
export const db = wrapPowerSyncWithDrizzle(powerSyncDb, {
  schema: drizzleSchema
});

// export const LISTS_TABLE = 'lists';
// export const TODOS_TABLE = 'todos';

// const todosDef = {
//   name: 'todos',
//   columns: {
//     list_id: column.text,
//     created_at: column.text,
//     completed_at: column.text,
//     description: column.text,
//     created_by: column.text,
//     completed_by: column.text,
//     completed: column.integer
//   },
//   options: { indexes: { list: ['list_id'] } }
// };

// const listsDef = {
//   name: 'lists',
//   columns: {
//     created_at: column.text,
//     name: column.text,
//     owner_id: column.text
//   },
//   options: {}
// };

export function makeSchema(synced: boolean = false) {
  const syncedName = (table: string): string => {
    if (synced) {
      // results in lists, todos
      return table;
    } else {
      // in the local-only mode of the demo
      // these tables are not used
      return `inactive_synced_${table}`;
    }
  };

  const localName = (table: string): string => {
    if (synced) {
      // in the sync-enabled mode of the demo
      // these tables are not used
      return `inactive_local_${table}`;
    } else {
      // results in lists, todos
      return table;
    }
  };

  // Define tables
  const conversationsSchema = new Table({
    name: column.text,
    conversation_summary: column.text,
    system_prompt: column.text,
    created_at: column.text, // PowerSync uses text for dates
    updated_at: column.text,
    top_k: column.real,
    temperature: column.real,
    userId: column.text
  }, { viewName: syncedName('conversations') });

  const conversationsSchemaLocal = new Table({
    name: column.text,
    conversation_summary: column.text,
    system_prompt: column.text,
    created_at: column.text, // PowerSync uses text for dates
    updated_at: column.text,
    top_k: column.real,
    temperature: column.real,
    userId: column.text
  }, {
    viewName: localName('conversations'), localOnly: true
  });

  const conversationMessagesSchema = new Table(
    {
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
    { indexes: { conversation: ['conversation_id'] }, viewName: syncedName('conversationMessages') }
  );

  const conversationMessagesSchemaLocal = new Table(
    {
      conversation_id: column.text,
      position: column.integer,
      role: column.text,
      content: column.text,
      created_at: column.text,
      updated_at: column.text,
      temperature_at_creation: column.real,
      top_k_at_creation: column.real
    },
    { indexes: { conversation: ['conversation_id'] }, localOnly: true, viewName: localName('conversationMessages') }
  );

  return new Schema({
    conversationsSchema,
    conversationMessagesSchema,
    // conversationsSchemaLocal,
    // conversationMessagesSchemaLocal
  });
}

export async function switchToSyncedSchema(db: AbstractPowerSyncDatabase, userId: string) {
  await db.updateSchema(makeSchema(true));
  setSyncEnabled(db.database.name, true);

  await db.writeTransaction(async (tx) => {
    // Copy local-only data to the sync-enabled views.
    // This records each operation in the upload queue.
    // Overwrites the local-only owner_id value with the logged-in user's id.
    await tx.execute(
      'INSERT INTO lists(id, name, created_at, owner_id) SELECT id, name, created_at, ? FROM inactive_local_lists',
      [userId]
    );

    // Overwrites the local-only created_by value with the logged-in user's id.
    await tx.execute(
      'INSERT INTO todos(id, list_id, created_at, completed_at, description, completed, created_by) SELECT id, list_id, created_at, completed_at, description, completed, ? FROM inactive_local_todos',
      [userId]
    );

    // Delete the local-only data.
    await tx.execute('DELETE FROM inactive_local_todos');
    await tx.execute('DELETE FROM inactive_local_lists');
  });
}

export async function switchToLocalSchema(db: AbstractPowerSyncDatabase) {
  await db.updateSchema(makeSchema(false));
  setSyncEnabled(db.database.name, false);
}

// This is only used for typing purposes

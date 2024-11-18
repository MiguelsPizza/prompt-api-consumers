import { column, PowerSyncDatabase, Schema, Table } from '@powersync/web';
import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { relations } from "drizzle-orm";
import { real, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Define tables
const conversationsSchema = new Table({
  name: column.text,
  conversation_summary: column.text,
  system_prompt: column.text,
  created_at: column.text, // PowerSync uses text for dates
  updated_at: column.text,
  top_k: column.real,
  temperature: column.real
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
    top_k_at_creation: column.real
  },
  { indexes: { conversation: ['conversation_id'] } }
);

// Create schema
export const AppSchema = new Schema({
  conversationsSchema,
  conversationMessagesSchema
});

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
  temperature: real("temperature")
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
  top_k_at_creation: real("top_k_at_creation")
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
    dbFilename: 'chat_database.db'
  }
});

// Wrap with Drizzle
export const db = wrapPowerSyncWithDrizzle(powerSyncDb, {
  schema: drizzleSchema
});
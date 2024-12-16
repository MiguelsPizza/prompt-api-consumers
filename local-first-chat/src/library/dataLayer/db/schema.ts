import { authUsers } from 'drizzle-orm/supabase';
import { text, real, integer, pgTable, index, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    conversation_summary: text('conversation_summary'),
    system_prompt: text('system_prompt').default('').notNull(),
    top_k: real('top_k').notNull(),
    temperature: real('temperature').notNull(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { mode: 'string' }).default(new Date().toISOString()).notNull(),
    updated_at: timestamp('updated_at', { mode: 'string' })
      .default(new Date().toISOString())
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (table) => [
    index('idx_conversations_user').on(table.user_id),
    index('idx_conversations_updated').on(table.updated_at),
    index('idx_conversations_user_updated').on(table.user_id, table.updated_at),
  ]
);

export const conversation_messages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey(),
    conversation_id: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
    content: text('content').notNull(),
    temperature_at_creation: real('temperature_at_creation').notNull(),
    top_k_at_creation: real('top_k_at_creation').notNull(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { mode: 'string' }).default(new Date().toISOString()).notNull(),
    updated_at: timestamp('updated_at', { mode: 'string' })
      .default(new Date().toISOString())
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (table) => [
    index('idx_messages_conversation').on(table.conversation_id),
    index('idx_messages_position').on(table.position),
    index('idx_messages_conv_position').on(table.conversation_id, table.position),
    index('idx_messages_created').on(table.created_at),
    index('idx_messages_user_created').on(table.user_id, table.created_at),
  ]
);

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  conversation_messages: many(conversation_messages),
  user: one(authUsers, {
    fields: [conversations.user_id],
    references: [authUsers.id],
  }),
}));

export const conversationMessagesRelations = relations(conversation_messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversation_messages.conversation_id],
    references: [conversations.id],
  }),
  user: one(authUsers, {
    fields: [conversation_messages.user_id],
    references: [authUsers.id],
  }),
}));

export type AuthUser = typeof authUsers.$inferSelect;

export type Conversation = typeof conversations.$inferSelect;
export type ConversationMessage = typeof conversation_messages.$inferSelect;

export type ConversationWithRelations = Conversation & {
  conversation_messages?: ConversationMessage[];
  user?: AuthUser;
};

export type ConversationMessageWithRelations = ConversationMessage & {
  conversation?: Conversation;
  user?: AuthUser;
};
export type NewConversation = typeof conversations.$inferInsert;
export type NewConversationMessage = typeof conversation_messages.$inferInsert;

import { text, real, integer, pgTable, index } from 'drizzle-orm/pg-core';

export const conversations = pgTable(
  'conversations',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    conversation_summary: text('conversation_summary'),
    system_prompt: text('system_prompt').default(''),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at'),
    top_k: real('top_k').notNull(),
    temperature: real('temperature').notNull(),
    user_id: text('user_id').notNull(),
  },
  (table) => [
    index('idx_conversations_user').on(table.user_id),
    index('idx_conversations_updated').on(table.updated_at),
    index('idx_conversations_user_updated').on(table.user_id, table.updated_at),
  ],
);

export const conversation_messages = pgTable(
  'conversation_messages',
  {
    id: text('id').primaryKey(),
    conversation_id: text('conversation_id'),
    position: integer('position'),
    role: text('role'),
    content: text('content'),
    created_at: text('created_at'),
    updated_at: text('updated_at'),
    temperature_at_creation: real('temperature_at_creation'),
    top_k_at_creation: real('top_k_at_creation'),
    user_id: text('user_id'),
  },
  (table) => [
    index('idx_messages_conversation').on(table.conversation_id),
    index('idx_messages_position').on(table.position),
    index('idx_messages_conv_position').on(
      table.conversation_id,
      table.position,
    ),
    index('idx_messages_created').on(table.created_at),
    index('idx_messages_user_created').on(table.user_id, table.created_at),
  ],
);

// Type inference
export type Conversation = typeof conversations.$inferSelect;
export type ConversationMessage = typeof conversation_messages.$inferSelect;

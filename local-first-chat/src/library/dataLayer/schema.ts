import {
  text,
  real,
  integer,
  pgTable,
  index,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

const timestamps = {
  created_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  updated_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull()
    .$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`),
}

// export const authUsers = pgTable(
//   'users',
//   {
//     id: uuid('id').primaryKey(),
//     email: text('email'),
//     phone: text('phone'),
//     email_confirmed_at: timestamp('email_confirmed_at', { mode: 'string' }),
//     phone_confirmed_at: timestamp('phone_confirmed_at', { mode: 'string' }),
//     last_sign_in_at: timestamp('last_sign_in_at', { mode: 'string' }),
//     created_at: timestamp('created_at', { mode: 'string' })
//       .defaultNow()
//       .notNull(),
//     updated_at: timestamp('updated_at', { mode: 'string' })
//       .defaultNow()
//       .notNull(),
//   },
//   (table) => [
//     { schema: 'auth' }
//   ]
// );

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    conversation_summary: text('conversation_summary'),
    system_prompt: text('system_prompt').default('').notNull(),
    top_k: real('top_k').notNull(),
    temperature: real('temperature').notNull(),
    user_id: uuid('user_id').notNull(),
    ...timestamps
  },
  (table) => [
    index('idx_conversations_updated').on(table.updated_at),
  ],
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
    user_id: uuid('user_id').notNull(),
    ...timestamps
  },
  (table) => [
    index('idx_messages_conversation').on(table.conversation_id),
    index('idx_messages_position').on(table.position),
    index('idx_messages_conv_position').on(
      table.conversation_id,
      table.position,
    ),
    index('idx_messages_created').on(table.created_at),
  ],
);


export const conversationsRelations = relations(
  conversations,
  ({ many, one }) => ({
    conversation_messages: many(conversation_messages),
  }),
);

export const conversationMessagesRelations = relations(
  conversation_messages,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversation_messages.conversation_id],
      references: [conversations.id],
    }),
  }),
);


export type Conversation = typeof conversations.$inferSelect;
export type ConversationMessage = typeof conversation_messages.$inferSelect;

export type ConversationWithRelations = Conversation & {
  conversation_messages?: ConversationMessage[];
};

export type ConversationMessageWithRelations = ConversationMessage & {
  conversation?: Conversation;
};
export type NewConversation = typeof conversations.$inferInsert;
export type NewConversationMessage = typeof conversation_messages.$inferInsert;

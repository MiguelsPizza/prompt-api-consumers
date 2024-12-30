import {
  text,
  real,
  integer,
  pgTable,
  index,
  timestamp,
  uuid,
  boolean,
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
  deleted_at: timestamp({ withTimezone: true, mode: 'string' }),
};

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    conversation_summary: text('conversation_summary'),
    system_prompt: text('system_prompt').default(''),
    top_k: real('top_k').notNull(),
    temperature: real('temperature').notNull(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    softDeleted: boolean('soft_deleted').default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    index('idx_conversations_updated').on(table.updated_at),
    index('idx_conversations_deleted').on(table.deleted_at),
    index('idx_conversations_user').on(table.user_id),
    index('idx_conversations_soft_deleted').on(table.softDeleted),
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
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    softDeleted: boolean('soft_deleted').default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    index('idx_messages_conversation').on(table.conversation_id),
    index('idx_messages_position').on(table.position),
    index('idx_messages_conv_position').on(
      table.conversation_id,
      table.position,
    ),
    index('idx_messages_created').on(table.created_at),
    index('idx_messages_soft_deleted').on(table.softDeleted),
  ],
);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  username: text('username'),
  lastSignInAt: timestamp('last_sign_in_at', { mode: 'string' }),
  ...timestamps,
});

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  createdById: text('created_by_id').references(() => users.id),
  ...timestamps,
});

export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    role: text('role').notNull(),
    ...timestamps,
  },
  (table) => [
    index('unique_membership').on(table.userId, table.organizationId),
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

export const userRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMemberships),
}));

export const organizationRelations = relations(
  organizations,
  ({ many, one }) => ({
    memberships: many(organizationMemberships),
    createdBy: one(users, {
      fields: [organizations.createdById],
      references: [users.id],
    }),
  }),
);

export const organizationMembershipRelations = relations(
  organizationMemberships,
  ({ one }) => ({
    user: one(users, {
      fields: [organizationMemberships.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [organizationMemberships.organizationId],
      references: [organizations.id],
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

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMembership =
  typeof organizationMemberships.$inferSelect;

export type UserWithRelations = User & {
  memberships?: OrganizationMembership[];
};

export type OrganizationWithRelations = Organization & {
  memberships?: OrganizationMembership[];
  createdBy?: User;
};

export type OrganizationMembershipWithRelations = OrganizationMembership & {
  user?: User;
  organization?: Organization;
};

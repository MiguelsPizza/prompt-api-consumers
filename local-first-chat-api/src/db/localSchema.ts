import {
  text,
  real,
  integer,
  pgTable,
  index,
  timestamp,
  uuid,
  boolean,
  check,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { electricTable, scaffoldLocalSchema } from './createThroughDBFromDrizzle';

const timestamps = {
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull()
    .$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`),
  deleted_at: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  server_synced: boolean('server_synced').default(false).notNull(),
  server_synced_date: timestamp('server_synced_date', {
    withTimezone: true,
    mode: 'string',
  }),
} as const;
// Create the PostgreSQL enum
export const supportedLLMEnum = pgEnum('supported_llm', [
  'chrome-ai',
  'web-llm',
]);

export const users = pgTable('users', {
  id: text('id').primaryKey(), // the uuid created by the web browser
  clerk_id: text('clerk_id').unique(), // the uuid from clerk
  first_name: text('first_name'),
  last_name: text('last_name'),
  email: text('email'),
  username: text('username'),
  last_active_at: integer('last_active_at'),
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

export const supported_llms = pgTable(
  'supported_llms',
  {
    id: text('id', { enum: supportedLLMEnum.enumValues }).primaryKey(),
    name: text('name').notNull(),
    max_temperature: real('max_temperature').notNull(),
    min_temperature: real('min_temperature').notNull(),
    max_top_k: real('max_top_k'),
    min_top_k: real('min_top_k'),
    ...timestamps,
  },
  (table) => [index('idx_supported_llms_name').on(table.name)],
);

export const {
  combinedTableView: conversations,
  localTable: conversations_local,
  syncedTable: conversations_synced,
} = electricTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    conversation_summary: text('conversation_summary'),
    system_prompt: text('system_prompt').default(''),
    top_k: real('top_k').notNull(),
    temperature: real('temperature').notNull(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    softDeleted: boolean('soft_deleted').default(false).notNull(),
    llm_id: supportedLLMEnum('llm_id').notNull().default('chrome-ai'),
    ...timestamps,
  },
  (table) => [
    check('name_length', sql`length(${table.name}) <= 255`),
    check('summary_length', sql`length(${table.conversation_summary}) <= 4000`),
    check('prompt_length', sql`length(${table.system_prompt}) <= 32000`),
    check('top_k_range', sql`${table.top_k} >= 0 AND ${table.top_k} <= 1000`),
    check(
      'temperature_range',
      sql`${table.temperature} >= 0 AND ${table.temperature} <= 10`,
    ),
    index('idx_conversations_updated').on(table.updated_at),
    index('idx_conversations_deleted').on(table.deleted_at),
    index('idx_conversations_user').on(table.user_id),
    index('idx_conversations_soft_deleted').on(table.softDeleted),
  ],
);

export const {
  combinedTableView: conversation_messages,
  localTable: local_conversation_messages,
  syncedTable: synced_conversation_messages,
} = electricTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversation_id: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
    content: text('content').notNull(),
    temperature_at_creation: real('temperature_at_creation').notNull(),
    top_k_at_creation: real('top_k_at_creation').notNull(),
    llm_id_at_creation: supportedLLMEnum('llm_id_at_creation')
      .notNull()
      .default('chrome-ai'),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    softDeleted: boolean('soft_deleted').default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    check('position_range', sql`${table.position} >= 0`),
    check('content_length', sql`length(${table.content}) <= 32000`),
    check(
      'temperature_range',
      sql`${table.temperature_at_creation} >= 0 AND ${table.temperature_at_creation} <= 10`,
    ),
    check(
      'top_k_range',
      sql`${table.top_k_at_creation} >= 0 AND ${table.top_k_at_creation} <= 1000`,
    ),

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

// export const supportedLlmsRelations = relations(supported_llms, ({ many }) => ({
//   conversations: many(conversations),
// }));

// export const conversationsRelations = relations(
//   conversations,
//   ({ many, one }) => ({
//     conversation_messages: many(conversation_messages),
//     llm: one(supported_llms, {
//       fields: [conversations.llm_id],
//       references: [supported_llms.id],
//     }),
//   }),
// );

// export const conversationMessagesRelations = relations(
//   conversation_messages,
//   ({ one }) => ({
//     conversation: one(conversations, {
//       fields: [conversation_messages.conversation_id],
//       references: [conversations.id],
//     }),
//     llm: one(supported_llms, {
//       fields: [conversation_messages.llm_id_at_creation],
//       references: [supported_llms.id],
//     }),
//   }),
// );

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

// export type Conversation = typeof conversations.$inferSelect;
// export type ConversationMessage = typeof conversation_messages.$inferSelect;

// export type ConversationWithRelations = Conversation & {
//   conversation_messages?: ConversationMessage[];
//   llm?: SupportedLlm;
// };

// export type ConversationMessageWithRelations = ConversationMessage & {
//   conversation?: Conversation;
//   llm?: SupportedLlm;
// };
// export type NewConversation = typeof conversations.$inferInsert;
// export type NewConversationMessage = typeof conversation_messages.$inferInsert;

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

export type SupportedLlm = typeof supported_llms.$inferSelect;
export type NewSupportedLlm = typeof supported_llms.$inferInsert;

export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<Omit<NewUser, 'id' | 'clerk_id'>>;

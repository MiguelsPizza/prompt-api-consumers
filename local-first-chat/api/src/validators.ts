import {
  conversation_messages,
  conversations,
  organizationMemberships,
  organizations,
  users,
} from '@local-first-web-ai-monorepo/schema/cloud';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import 'zod-openapi/extend';

// Conversation schemas
export const createConversationSchema = createInsertSchema(conversations)
  .pick({
    name: true,
    conversation_summary: true,
    system_prompt: true,
    created_at: true,
    updated_at: true,
    top_k: true,
    temperature: true,
    user_id: true,
    llm_id: true,
    id: true,
  })
  .openapi({ ref: 'CreateConversation' });

export const conversationResponseSchema = createSelectSchema(conversations)
  .omit({ deleted_at: true })
  .openapi({ ref: 'Conversation' });

// Message schemas
export const createMessageSchema = createInsertSchema(conversation_messages)
  .pick({
    id: true,
    llm_id_at_creation: true,
    conversation_id: true,
    role: true,
    content: true,
    created_at: true,
    updated_at: true,
    temperature_at_creation: true,
    top_k_at_creation: true,
    position: true,
    user_id: true,
  })
  .openapi({ ref: 'CreateMessage' });

export const messageResponseSchema = createSelectSchema(conversation_messages)
  .omit({ deleted_at: true })
  .openapi({ ref: 'Message' });

// User schemas
export const createUserSchema = createInsertSchema(users)
  .pick({
    id: true,
    clerk_id: true,
    first_name: true,
    last_name: true,
    email: true,
    username: true,
    last_active_at: true,
  })
  .openapi({ ref: 'CreateUser' });

export const userResponseSchema = createSelectSchema(users)
  .omit({ deleted_at: true })
  .openapi({ ref: 'User' });

// Add update user schema
export const updateUserSchema = createInsertSchema(users)
  .pick({
    first_name: true,
    last_name: true,
    email: true,
    username: true,
    last_active_at: true,
  })
  .partial() // Makes all fields optional
  .openapi({ ref: 'UpdateUser' });

// Organization schemas
export const createOrganizationSchema = createInsertSchema(organizations)
  .pick({
    id: true,
    name: true,
    slug: true,
    createdById: true,
  })
  .openapi({ ref: 'CreateOrganization' });

export const organizationResponseSchema = createSelectSchema(organizations)
  .omit({ deleted_at: true })
  .openapi({ ref: 'Organization' });

// Organization Membership schemas
export const createOrganizationMembershipSchema = createInsertSchema(
  organizationMemberships,
)
  .pick({
    id: true,
    userId: true,
    organizationId: true,
    role: true,
  })
  .openapi({ ref: 'CreateOrganizationMembership' });

export const organizationMembershipResponseSchema = createSelectSchema(
  organizationMemberships,
)
  .omit({ deleted_at: true })
  .openapi({ ref: 'OrganizationMembership' });

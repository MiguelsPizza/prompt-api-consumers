import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { conversations, conversation_messages } from './db/schema';
import { z } from 'zod';
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
  })
  .openapi({ ref: 'CreateConversation' });

export const conversationResponseSchema = createSelectSchema(conversations)
  .omit({ deleted_at: true })
  .openapi({ ref: 'Conversation' });

// Message schemas
export const createMessageSchema = createInsertSchema(conversation_messages)
  .pick({
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

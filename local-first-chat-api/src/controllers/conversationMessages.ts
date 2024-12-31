import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/zod';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq } from 'drizzle-orm';
import { conversation_messages } from '../db/schema';
import { createMessageSchema, messageResponseSchema } from '../validators';
import { Bindings } from '..';
import { z } from 'zod';

const app = new Hono<{ Bindings: Bindings }>()
  .basePath('/conversations/:conversationId/messages')
  .post(
    '/',
    describeRoute({
      tags: ['Messages'],
      summary: 'Create a new message in a conversation',
      description:
        'Creates a new message and associates it with the specified conversation',

      responses: {
        200: {
          description: 'Message created successfully',
          content: {
            'application/json': {
              schema: resolver(messageResponseSchema),
            },
          },
        },
        400: {
          description: 'Invalid request body',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { error: { type: 'string' } },
              },
            },
          },
        },
      },
    }),
    validator('json', createMessageSchema),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const body = c.req.valid('json');

      const message = await db
        .insert(conversation_messages)
        .values({
          id: crypto.randomUUID(),
          ...body,
        })
        .returning();

      return c.json(message[0]);
    },
  )
  .get(
    '/',
    describeRoute({
      tags: ['Messages'],
      summary: 'Get all messages in a conversation',
      description:
        'Retrieves all non-deleted messages for the specified conversation',
      responses: {
        200: {
          description: 'List of messages',
          content: {
            'application/json': {
              schema: resolver(z.array(messageResponseSchema)),
            },
          },
        },
      },
    }),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const { conversationId } = c.req.param();

      const messages = await db
        .select()
        .from(conversation_messages)
        .where(
          and(
            eq(conversation_messages.conversation_id, conversationId),
            eq(conversation_messages.softDeleted, false),
          ),
        )
        .orderBy(conversation_messages.position);

      return c.json(messages);
    },
  )
  .put(
    '/:messageId',
    describeRoute({
      tags: ['Messages'],
      summary: 'Update a message',
      description: 'Updates an existing message in the conversation',
      responses: {
        200: {
          description: 'Message updated successfully',
          content: {
            'application/json': {
              schema: resolver(messageResponseSchema),
            },
          },
        },
        404: {
          description: 'Message not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { error: { type: 'string' } },
              },
            },
          },
        },
      },
    }),
    validator('json', createMessageSchema.partial()),
    async (c) => {
      const test = await c.req.json();
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const { messageId } = c.req.param();
      const body = await c.req.json();

      const updated = await db
        .update(conversation_messages)
        .set(body)
        .where(eq(conversation_messages.id, messageId))
        .returning();

      if (!updated.length) {
        return c.json({ error: 'Message not found' }, 404);
      }

      return c.json(updated[0]);
    },
  )
  .delete(
    '/:messageId',
    describeRoute({
      tags: ['Messages'],
      summary: 'Soft delete a message',
      description:
        'Marks a message as deleted without removing it from the database',

      responses: {
        200: {
          description: 'Message deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        404: {
          description: 'Message not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { error: { type: 'string' } },
              },
            },
          },
        },
      },
    }),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const { messageId } = c.req.param();

      const deleted = await db
        .update(conversation_messages)
        .set({ softDeleted: true })
        .where(eq(conversation_messages.id, messageId))
        .returning();

      if (!deleted.length) {
        return c.json({ error: 'Message not found' }, 404);
      }

      return c.json({ message: 'Message deleted successfully' });
    },
  );

export default app;

import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/zod';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq } from 'drizzle-orm';
import { getAuth } from '@hono/clerk-auth';
import { conversations } from '../db/schema';
import {
  createConversationSchema,
  conversationResponseSchema,
} from '../validators';
import { Env } from '../env';

const app = new Hono<{ Bindings: Env }>()
  .basePath('conversations')
  .post(
    '/',
    describeRoute({
      tags: ['Conversations'],
      summary: 'Create a new conversation',
      description: 'Creates a new conversation with the provided details',
      responses: {
        200: {
          description: 'Conversation created successfully',
          content: {
            'application/json': {
              schema: resolver(conversationResponseSchema),
            },
          },
        },
      },
    }),
    validator('json', createConversationSchema),
    async (c) => {
      const auth = getAuth(c);
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const body = c.req.valid('json');

      const conversation = await db
        .insert(conversations)
        .values({
          ...body,
        })
        .returning();

      return c.json(conversation[0]);
    },
  )
  .get(
    '/',
    describeRoute({
      tags: ['Conversations'],
      summary: 'List all conversations',
      description: 'Retrieves a list of all non-deleted conversations',
      responses: {
        200: {
          description: 'List all conversations',
          content: {
            'application/json': {
              schema: resolver(z.array(conversationResponseSchema)),
            },
          },
        },
      },
    }),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);

      const allConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.softDeleted, false));

      return c.json(allConversations);
    },
  )
  .get(
    '/:id',
    describeRoute({
      tags: ['Conversations'],
      summary: 'Get conversation by ID',
      description: 'Retrieves a specific conversation by its unique identifier',
      responses: {
        200: {
          description: 'Get conversation by ID',
          content: {
            'application/json': {
              schema: resolver(conversationResponseSchema),
            },
          },
        },
        404: {
          description: 'Conversation not found',
          content: {
            'application/json': {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const { id } = c.req.param();

      const conversation = await db
        .select()
        .from(conversations)
        .where(
          and(eq(conversations.id, id), eq(conversations.softDeleted, false)),
        );

      if (!conversation.length) {
        return c.json({ error: 'Conversation not found' }, 404);
      }

      return c.json(conversation[0]);
    },
  )
  .put(
    '/:id',
    describeRoute({
      tags: ['Conversations'],
      summary: 'Update conversation',
      description: 'Updates an existing conversation with the provided changes',
      responses: {
        200: {
          description: 'Conversation updated successfully',
          content: {
            'application/json': {
              schema: resolver(conversationResponseSchema),
            },
          },
        },
        404: {
          description: 'Conversation not found',
          content: {
            'application/json': {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    validator('json', createConversationSchema.partial()),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const { id } = c.req.param();
      const body = c.req.valid('json');

      const updated = await db
        .update(conversations)
        .set(body)
        .where(eq(conversations.id, id))
        .returning();

      if (!updated.length) {
        return c.json({ error: 'Conversation not found' }, 404);
      }

      return c.json(updated[0]);
    },
  )
  .delete(
    '/:id',
    describeRoute({
      tags: ['Conversations'],
      summary: 'Delete conversation',
      description:
        'Soft deletes an existing conversation by marking it as deleted',
      responses: {
        200: {
          description: 'Conversation deleted successfully',
          content: {
            'application/json': {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: 'Conversation not found',
          content: {
            'application/json': {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const { id } = c.req.param();

      const deleted = await db
        .update(conversations)
        .set({ softDeleted: true })
        .where(eq(conversations.id, id))
        .returning();

      if (!deleted.length) {
        return c.json({ error: 'Conversation not found' }, 404);
      }

      return c.json({ message: 'Conversation deleted successfully' });
    },
  );

export default app;

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
import { Bindings } from '..';

const app = new Hono<{ Bindings: Bindings }>()
  .basePath('conversations')
  .post(
    '/',
    describeRoute({
      tags: ['Conversations'],
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
          id: crypto.randomUUID(),
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
  .delete('/:id', async (c) => {
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
  });

export default app;

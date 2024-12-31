import { describeRoute, openAPISpecs } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/zod';
import { instrument } from '@fiberplane/hono-otel';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, conversations, conversation_messages } from './db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  createConversationSchema,
  conversationResponseSchema,
  createMessageSchema,
  messageResponseSchema,
} from './validators';
import { Hono } from 'hono';
import { apiReference } from '@scalar/hono-api-reference';

type Bindings = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Root route
app.get(
  '/',
  describeRoute({
    tags: ['System'],
    responses: {
      200: {
        description: 'Welcome message',
        content: {
          'text/plain': {
            schema: resolver(z.string()),
          },
        },
      },
    },
  }),
  (c) => c.text('Supa Honc! 📯🪿📯🪿📯🪿📯'),
);

// Create conversation
app.post(
  '/api/conversations',
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
);

// Get all conversations
app.get(
  '/api/conversations',
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
);

// Get single conversation
app.get(
  '/api/conversations/:id',
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
);

// Update conversation
app.put(
  '/api/conversations/:id',
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
);

// Create conversation message
app.post(
  '/api/conversations/:conversationId/messages',
  describeRoute({
    tags: ['Messages'],
    responses: {
      200: {
        description: 'Message created successfully',
        content: {
          'application/json': {
            schema: resolver(messageResponseSchema),
          },
        },
      },
    },
  }),
  validator('json', createMessageSchema),
  async (c) => {
    const sql = postgres(c.env.DATABASE_URL);
    const db = drizzle(sql);
    const { conversationId } = c.req.param();
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
);

// Get conversation messages
app.get('/api/conversations/:conversationId/messages', async (c) => {
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
});

// Update message
app.put('/api/conversations/:conversationId/messages/:messageId', async (c) => {
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
});

// Soft delete message
app.delete(
  '/api/conversations/:conversationId/messages/:messageId',
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

// Soft delete conversation
app.delete('/api/conversations/:id', async (c) => {
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

// Add OpenAPI documentation
app.get(
  '/openapi',
  openAPISpecs(app, {
    documentation: {
      info: {
        title: 'Rhinobase Cloud',
        version: '1.0.0',
        description: 'API Documentation',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      servers: [
        {
          url: 'http://localhost:3004',
          description: 'Local server',
        },
      ],
    },
  }),
);

app.get(
  '/docs',
  apiReference({
    theme: 'saturn',
    spec: {
      url: '/openapi',
    },
  }),
);

export default instrument(app);

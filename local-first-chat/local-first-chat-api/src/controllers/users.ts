import * as schema from '@local-first-web-ai-monorepo/schema/cloud';
import { users } from '@local-first-web-ai-monorepo/schema/cloud';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator as zValidator } from 'hono-openapi/zod';
import postgres from 'postgres';
import { createUserSchema, userResponseSchema } from '../validators';

import { Env } from '../env';

const app = new Hono<{ Bindings: Env }>()
  .basePath('/users')
  .post(
    '/',
    describeRoute({
      tags: ['Users'],
      summary: 'Create a new user',
      description: 'Creates a new user record from Clerk user data',
      responses: {
        200: {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: resolver(userResponseSchema),
            },
          },
        },
      },
      validateResponse: true,
    }),
    zValidator('json', createUserSchema),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql, { schema });
      const body = c.req.valid('json');

      const user = await db.insert(users).values(body).returning();

      return c.json(user[0]);
    },
  )
  .get(
    '/:userId',
    describeRoute({
      tags: ['Users'],
      summary: 'Get a user by ID',
      description: 'Retrieves user information by their ID',
      responses: {
        200: {
          description: 'User found',
          content: {
            'application/json': {
              schema: resolver(userResponseSchema),
            },
          },
        },
        404: {
          description: 'User not found',
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
      const db = drizzle(sql, { schema });
      const { userId } = c.req.param();

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        return c.json({ error: 'User not found' }, 404);
      }

      return c.json(user[0]);
    },
  )
  .put(
    '/:userId',
    describeRoute({
      tags: ['Users'],
      summary: 'Update a user',
      description: 'Updates user information',
      responses: {
        200: {
          description: 'User updated successfully',
          content: {
            'application/json': {
              schema: resolver(userResponseSchema),
            },
          },
        },
        404: {
          description: 'User not found',
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
    zValidator('json', createUserSchema.partial()),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql, { schema });
      const { userId } = c.req.param();
      const body = c.req.valid('json');

      const updated = await db
        .update(users)
        .set(body)
        .where(eq(users.id, userId))
        .returning();

      if (!updated.length) {
        return c.json({ error: 'User not found' }, 404);
      }

      return c.json(updated[0]);
    },
  );

export default app;

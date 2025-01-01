import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator as zValidator } from 'hono-openapi/zod';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq } from 'drizzle-orm';
import { organizations, organizationMemberships } from '../db/schema';
import {
  createOrganizationSchema,
  organizationResponseSchema,
} from '../validators';
import { z } from 'zod';
import { Env } from '../env';

const app = new Hono<{ Bindings: Env }>()
  .basePath('/organizations')
  .post(
    '/',
    describeRoute({
      tags: ['Organizations'],
      summary: 'Create a new organization',
      description:
        'Creates a new organization and sets the creator as the first member',
      responses: {
        200: {
          description: 'Organization created successfully',
          content: {
            'application/json': {
              schema: resolver(organizationResponseSchema),
            },
          },
        },
      },
      validateResponse: true,
    }),
    zValidator('json', createOrganizationSchema),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const body = c.req.valid('json');

      const organization = await db
        .insert(organizations)
        .values(body)
        .returning();

      // Create initial membership for creator
      await db.insert(organizationMemberships).values({
        userId: body.createdById!,
        organizationId: organization[0].id,
        role: 'admin',
      });

      return c.json(organization[0]);
    },
  )
  .get(
    '/',
    describeRoute({
      tags: ['Organizations'],
      summary: 'Get all organizations',
      description: 'Retrieves all organizations the user has access to',
      responses: {
        200: {
          description: 'List of organizations',
          content: {
            'application/json': {
              schema: resolver(z.array(organizationResponseSchema)),
            },
          },
        },
      },
    }),
    async (c) => {
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);

      const orgs = await db
        .select()
        .from(organizations)
        .orderBy(organizations.name);

      return c.json(orgs);
    },
  )
  .put(
    '/:organizationId',
    describeRoute({
      tags: ['Organizations'],
      summary: 'Update an organization',
      description: 'Updates an existing organization',
      responses: {
        200: {
          description: 'Organization updated successfully',
          content: {
            'application/json': {
              schema: resolver(organizationResponseSchema),
            },
          },
        },
        404: {
          description: 'Organization not found',
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
    zValidator('json', createOrganizationSchema.partial()),
    async (c) => {
      const body = c.req.valid('json');
      const sql = postgres(c.env.DATABASE_URL);
      const db = drizzle(sql);
      const { organizationId } = c.req.param();

      const updated = await db
        .update(organizations)
        .set(body)
        .where(eq(organizations.id, organizationId))
        .returning();

      if (!updated.length) {
        return c.json({ error: 'Organization not found' }, 404);
      }

      return c.json(updated[0]);
    },
  )
  .delete(
    '/:organizationId',
    describeRoute({
      tags: ['Organizations'],
      summary: 'Delete an organization',
      description: 'Deletes an organization and all its memberships',
      responses: {
        200: {
          description: 'Organization deleted successfully',
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
          description: 'Organization not found',
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
      const { organizationId } = c.req.param();

      const deleted = await db
        .delete(organizations)
        .where(eq(organizations.id, organizationId))
        .returning();

      if (!deleted.length) {
        return c.json({ error: 'Organization not found' }, 404);
      }

      return c.json({ message: 'Organization deleted successfully' });
    },
  );

export default app;

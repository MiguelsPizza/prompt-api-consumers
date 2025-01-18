import { Hono } from 'hono';
import { instrument } from '@fiberplane/hono-otel';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { clerkMiddleware } from '@hono/clerk-auth';
import { requestId } from 'hono/request-id';
import { openAPISpecs } from 'hono-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/backend';
import * as schema from './db/schema';

import apiControllers from './controllers';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { Env } from './env';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { createUserSchema, updateUserSchema } from './validators';
import { eq } from 'drizzle-orm';

const app = new Hono<{ Bindings: Env }>()
  .use(
    '*',
    clerkMiddleware({
      requireSecretKey: true,
    }),
    logger(),
    prettyJSON(),
    requestId(),
  )
  .post('/api/webhooks', async (c) => {
    const SIGNING_SECRET = c.env.SIGNING_SECRET;
    if (!SIGNING_SECRET) {
      throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');
    }

    // Create new Svix instance with secret
    const wh = new Webhook(SIGNING_SECRET);

    // Get headers
    const svix_id = c.req.header('svix-id');
    const svix_timestamp = c.req.header('svix-timestamp');
    const svix_signature = c.req.header('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return c.json({ error: 'Missing Svix headers' }, 400);
    }

    // Get body
    const payload = await c.req.json();
    const body = JSON.stringify(payload);

    let evt: WebhookEvent;

    // Verify payload with headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return c.json({ error: 'Verification failed' }, 400);
    }

    // Handle the webhook event
    const { id } = evt.data;
    const eventType = evt.type;
    console.log(`Received webhook with ID ${id} and type ${eventType}`);
    const sql = postgres(c.env.DATABASE_URL);
    const db = drizzle(sql, { schema });
    const currTime = new Date().toUTCString();
    // Optional: Handle specific event types
    if (eventType === 'user.created') {
      console.log('New user created:', evt.data.id);
      const newUser = createUserSchema.safeParse({
        id: evt.data.external_id as string,
        last_active_at: evt.data.last_active_at,
        server_synced: true,
        server_synced_date: currTime,
        clerk_id: evt.data.id,
        first_name: evt.data.first_name,
        last_name: evt.data.last_name,
        email: evt.data.email_addresses?.[0]?.email_address,
        username: evt.data.username,
      });
      if (newUser.error) {
        return c.json(JSON.stringify(newUser.error, null, 2), 400);
      }
      await db.insert(schema.users).values(newUser.data);
    } else if (eventType === 'user.updated') {
      console.log('User updated:', evt.data.id);
      const updateData = updateUserSchema.safeParse({
        first_name: evt.data.first_name,
        last_name: evt.data.last_name,
        email: evt.data.email_addresses?.[0]?.email_address,
        username: evt.data.username,
        last_active_at: evt.data.last_active_at,
        server_synced: true,
        server_synced_date: currTime,
      });

      if (updateData.error) {
        return c.json(JSON.stringify(updateData.error, null, 2), 400);
      }

      await db
        .update(schema.users)
        .set(updateData.data)
        .where(eq(schema.users.clerk_id, evt.data.id));
    } else if (eventType === 'user.deleted') {
      console.log('User deleted:', evt.data.id);
      // Soft delete by updating the deleted_at timestamp
      await db
        .update(schema.users)
        .set({
          deleted_at: new Date().toISOString(),
          server_synced: true,
          server_synced_date: currTime,
        })
        .where(eq(schema.users.clerk_id, evt.data.id!));
    }
    return c.json({ message: 'Webhook received' }, 200);
  })
  .route('/', apiControllers);

// OpenAPI documentation
app.get(
  '/openapi',
  openAPISpecs(app, {
    documentation: {
      info: {
        title: 'Local First Chat API',
        version: '1.0.0',
        description: 'A secure, local-first chat API with Clerk authentication',
        contact: {
          name: 'API Support',
          url: 'https://github.com/yourusername/local-first-chat-api',
        },
      },
      servers: [],
      components: {
        securitySchemes: {
          clerkAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'Clerk JWT token. Format: Bearer <token>',
          },
        },
      },
      security: [{ clerkAuth: [] }],
    },
  }),
);
app.get(
  '/',
  apiReference({
    theme: 'saturn',
    spec: {
      url: '/openapi',
    },
    layout: 'modern',
    authentication: {
      preferredSecurityScheme: 'clerkAuth',
      apiKey: {
        token: '',
      },
    },
    showSidebar: true,
    hideModels: false,
    hideDownloadButton: false,
    hideTestRequestButton: false,
    hideSearch: false,
    darkMode: true,
    hideDarkModeToggle: false,
    defaultOpenAllTags: true,
    operationsSorter: 'method',
    favicon: 'test',
    customCss: `
      :root {
        --scalar-primary: #646cff;
      }
    `,
    metaData: {
      title: 'Local First Chat API Documentation',
      ogImage: '../public/favicon.ico',
      description: 'API documentation for the Local First Chat system',
      ogTitle: 'Local First Chat API Docs',
      ogDescription: 'Explore and test the Local First Chat API endpoints',
    },
  }),
);

app.notFound((c) => {
  return c.html(
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: system-ui, -apple-system, sans-serif;
          background: #111827;
          color: #e5e7eb;
          position: relative;
          overflow: hidden;
        }
        .container {
          text-align: center;
          padding: 2rem;
          position: relative;
          z-index: 1;
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          border: 1px solid rgba(100, 108, 255, 0.2);
          box-shadow: 0 0 30px rgba(100, 108, 255, 0.2);
        }
        h1 {
          font-size: 8rem;
          margin: 0;
          color: #646cff;
          text-shadow: 0 0 20px rgba(100, 108, 255, 0.5);
          animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
          from {
            text-shadow: 0 0 20px rgba(100, 108, 255, 0.5);
          }
          to {
            text-shadow: 0 0 30px rgba(100, 108, 255, 0.8),
                         0 0 40px rgba(100, 108, 255, 0.3);
          }
        }
        p {
          font-size: 1.5rem;
          margin: 1rem 0;
          color: #9ca3af;
        }
        .back-link {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #646cff;
          color: white;
          text-decoration: none;
          border-radius: 0.375rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .back-link:hover {
          background: #4e54cc;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(100, 108, 255, 0.4);
        }
        .back-link:active {
          transform: translateY(0);
        }
        .particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, #646cff 0%, transparent 70%);
          opacity: 0.1;
          animation: pulse 4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.2); opacity: 0.15; }
        }
      </style>
    </head>
    <body>
      <div class="particles"></div>
      <div class="container">
        <h1>404</h1>
        <p>Oops! The page you're looking for doesn't exist.</p>
        <a href="/" class="back-link">Go Back Home</a>
      </div>
    </body>
    </html>
  `,
    404,
  );
});

interface ApiError {
  code: string;
  message: string;
  requestId?: string;
  timestamp: string;
}

app.onError((err, c) => {
  const requestId = c.get('requestId');
  const timestamp = new Date().toISOString();

  // Log error with context
  console.error({
    error: err.message,
    stack: err.stack,
    requestId,
    path: c.req.path,
    method: c.req.method,
    timestamp,
  });

  // Prepare client-safe error response
  const errorResponse: ApiError = {
    code: err.name || 'INTERNAL_SERVER_ERROR',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    requestId,
    timestamp,
  };

  // Return JSON response with appropriate status
  return c.json(
    errorResponse,
    err instanceof Error && 'status' in err
      ? (err.status as ContentfulStatusCode)
      : 500,
  );
});

export default instrument(app);

export type AppType = typeof app;

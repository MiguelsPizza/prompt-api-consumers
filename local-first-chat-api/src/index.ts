import { Hono } from 'hono';
import { instrument } from '@fiberplane/hono-otel';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { clerkMiddleware } from '@hono/clerk-auth';
import { requestId } from 'hono/request-id';
import { describeRoute } from 'hono-openapi';
import { resolver } from 'hono-openapi/zod';
import { z } from 'zod';
import { openAPISpecs } from 'hono-openapi';
import { apiReference } from '@scalar/hono-api-reference';

import conversationsController from './controllers/conversations';
import messagesController from './controllers/conversationMessages';

export type Bindings = {
  DATABASE_URL: string;
};

const apiVersion = 'v1';
const app = new Hono<{ Bindings: Bindings }>();

app.use('*', clerkMiddleware(), logger(), prettyJSON(), requestId());

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

// Mount controllers
app.route(`${apiVersion}`, conversationsController);
app.route(`${apiVersion}`, messagesController);

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
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local Development',
        },
        // Add your production server here when ready
      ],
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
  '/docs',
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

export default instrument(app);

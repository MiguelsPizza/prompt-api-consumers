import { GlobalDrizzleDB } from '@/dataLayer';
import * as schema from '@local-first-web-ai-monorepo/schema/cloud';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';


export const router = createRouter({
  routeTree,
  context: {
    user: null,
    isInitialized: false,
    isAuthenticated: false,
    db: undefined,
  },
});


export type RouterType = typeof router;

declare module '@tanstack/react-router' {
  interface Register {
    router: RouterType;
  }
}

export interface RouterContext {
  user: schema.User | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  db?: GlobalDrizzleDB;
  meta?: {
    title?: string;
    description?: string;
  };
}

export default router
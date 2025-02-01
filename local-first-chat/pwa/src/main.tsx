import ReactDOM from 'react-dom/client';
import '../styles.css';

import { SystemProvider } from '@/components/providers/SystemProvider';
import PWABadge from '@/components/widgets/PWABadge';
import { WorkerErrorListener } from '@/components/widgets/WorkerErrorListener';
import { GlobalDrizzleDB } from '@/dataLayer';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from '@local-first-web-ai-monorepo/react-ui/components/toaster';
import * as schema from '@local-first-web-ai-monorepo/schema/cloud';
import { AICapabilitiesProvider } from '@local-first-web-ai-monorepo/use-prompt-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

export const queryClient = new QueryClient();
// while (!routeTree) {
//   if (routeTree) break;
// }
console.log(routeTree);
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <AICapabilitiesProvider>
          <SystemProvider router={router} />
          <WorkerErrorListener />
          <PWABadge />
          <Toaster />
        </AICapabilitiesProvider>
      </ClerkProvider>
    </QueryClientProvider>
  </>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { RouterProvider, createRouter } from '@tanstack/react-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SystemProvider from '@/components/providers/SystemProvider';
import { AICapabilitiesProvider } from 'use-prompt-api';
import PWABadge from '@/components/widgets/PWABadge';
import { Toaster } from '@/components/ui/toaster';
import { ClerkProvider } from '@clerk/clerk-react'


import type { Session, User } from '@supabase/supabase-js';

export interface RouterContext {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  meta?: {
    title?: string;
    description?: string;
  };
}

const router = createRouter({
  routeTree,
  context: {
    session: null,
    user: null,
    isInitialized: false,
    isAuthenticated: false,
  },
});

function AppRouter() {
  return <RouterProvider router={router} context={{}} />;
}

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <SystemProvider>
          <AICapabilitiesProvider>
            <AppRouter />
          </AICapabilitiesProvider>
        </SystemProvider>
      </QueryClientProvider>
    </ClerkProvider>
    <PWABadge />
    <Toaster />
  </React.StrictMode>,
);

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

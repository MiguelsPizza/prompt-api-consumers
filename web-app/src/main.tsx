import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { RouterProvider, createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SystemProvider from '@/components/providers/SystemProvider';
import { AICapabilitiesProvider } from 'use-prompt-api';
import PWABadge from '@/components/widgets/PWABadge';
import { Toaster } from '@/components/ui/toaster';
import { useSupabase } from '@/utils/Contexts';

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
  }
});




function AppRouter() {
  const connector = useSupabase()
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const listener = connector.registerListener({
      initialized: () => {
        setIsInitialized(true);
      },
      sessionStarted: () => {
        router.invalidate();
      }
    });

    return () => listener?.();
  }, [connector]);

  return (
    <RouterProvider
      router={router}
      context={{
        session: connector.currentSession,
        user: connector.currentSession?.user ?? null,
        isInitialized,
        isAuthenticated: !!connector.currentSession,
      }}
    />
  );
}
const queryClient = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SystemProvider>
        <AICapabilitiesProvider>
          <AppRouter />
        </AICapabilitiesProvider>
      </SystemProvider>
    </QueryClientProvider>
    <PWABadge />
    <Toaster />
  </React.StrictMode>,
);

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
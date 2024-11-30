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

// Create a new router instance
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <QueryClientProvider client={queryClient}>
      <SystemProvider>
        <AICapabilitiesProvider>
          <RouterProvider router={router} />
        </AICapabilitiesProvider>
      </SystemProvider>
    </QueryClientProvider>
    <PWABadge />
    <Toaster />
  </>,
);

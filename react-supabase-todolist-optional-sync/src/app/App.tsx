import { SystemProvider } from '@/components/providers/SystemProvider';
import router from './router';
import { RouterProvider } from '@tanstack/react-router';
import PWABadge from '@/components/widgets/PWABadge.js';
import { Toaster } from '@/components/ui/toaster.js';
import { AICapabilitiesProvider } from 'use-prompt-api';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import ChatInterface from './views/ChatInterface';

export default function App() {
  const queryClient = useMemo(() => new QueryClient(), [])
  return (
    <QueryClientProvider client={queryClient}>
      <SystemProvider>
        <AICapabilitiesProvider>
          <RouterProvider router={router} />
          <PWABadge />
          <Toaster />
        </AICapabilitiesProvider>
      </SystemProvider>
    </QueryClientProvider>
  );
}



import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SystemProvider } from '@/components/providers/SystemProvider';
import { AICapabilitiesProvider } from 'use-prompt-api';
import PWABadge from '@/components/widgets/PWABadge';
import { Toaster } from '@/components/ui/toaster';
import { ClerkProvider } from '@clerk/clerk-react';
import { WorkerErrorListener } from '@/components/widgets/WorkerErrorListener';

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

export const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <AICapabilitiesProvider>
          <SystemProvider />
        </AICapabilitiesProvider>
      </QueryClientProvider>
    </ClerkProvider>
    <WorkerErrorListener />
    <PWABadge />
    <Toaster />
  </React.StrictMode>,
);

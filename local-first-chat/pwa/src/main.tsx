import "@local-first-web-ai-monorepo/react-ui/css";

import ReactDOM from 'react-dom/client';

import { SystemProvider } from '@/components/providers/SystemProvider';
import PWABadge from '@/components/widgets/PWABadge';
import { WorkerErrorListener } from '@/components/widgets/WorkerErrorListener';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from '@local-first-web-ai-monorepo/react-ui/components/toaster';
import { AICapabilitiesProvider } from '@local-first-web-ai-monorepo/use-prompt-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

export const queryClient = new QueryClient();
// while (!routeTree) {
//   if (routeTree) break;
// }


ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <AICapabilitiesProvider>
          <SystemProvider />
          <WorkerErrorListener />
          <PWABadge />
          <Toaster />
        </AICapabilitiesProvider>
      </ClerkProvider>
    </QueryClientProvider>
  </>,
);

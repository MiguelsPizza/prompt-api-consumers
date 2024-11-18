import PWABadge from './PWABadge.tsx';
import PromptApiPlayground from './PromptApiPlayground.tsx';
import { Toaster } from './components/ui/toaster.tsx';
import { AICapabilitiesProvider } from 'use-prompt-api';

import { PowerSyncContext } from "@powersync/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import { powerSyncDb } from './local-db/sqliteDb.ts';


function App() {
  const queryClient = useMemo(() => new QueryClient(), [])
  return (
    <PowerSyncContext.Provider value={powerSyncDb}>
      <QueryClientProvider client={queryClient}>
        <AICapabilitiesProvider>
          <PromptApiPlayground />
          <PWABadge />
          <Toaster />
        </AICapabilitiesProvider>
      </QueryClientProvider>
    </PowerSyncContext.Provider>
  );
}

export default App;

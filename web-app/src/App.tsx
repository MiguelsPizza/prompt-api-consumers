import PWABadge from './PWABadge.tsx';
import PromptApiPlayground from './PromptApiPlayground.tsx';
import { Toaster } from './components/ui/toaster.tsx';
import { AICapabilitiesProvider } from 'use-prompt-api';
// App.jsx
import { PowerSyncDatabase } from '@powersync/web';
// or for React Native
// import { PowerSyncDatabase } from '@powersync/react-native';

import { PowerSyncContext } from "@powersync/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';


function App() {
  const powerSync = useMemo(() => {
    // Set up PowerSync client
  }, [])
  const queryClient = useMemo(() => new QueryClient(), [])
  return (
    <PowerSyncContext.Provider value={powerSync}>
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

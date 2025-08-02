import React from 'react';
import ReactDOM from 'react-dom/client';

// import App from './OldApp.tsx';
import '@local-first-web-ai-monorepo/react-ui/css';

import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';

// Import the generated route tree
import { QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from '../../src/routeTree.gen';
import { queryClient, trpc, trpc_api, trpcClient } from './trpcClient';

const memoryHistory = createMemoryHistory({
  initialEntries: ['/'], // Pass your initial URL
});

// Create a new router instance
const router = createRouter({
  routeTree,
  history: memoryHistory,
  context: {
    trpc: trpc_api,
    queryClient
  }
})
// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>,
);

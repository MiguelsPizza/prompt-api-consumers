import { chromeLink } from '@/chromeTrpcAdditions/trpc-browser/link';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SessionDetail from './routes/SessionDetail';
import SessionList from './routes/SessionList';
import { trpc } from './trpcClient';

const port = chrome.runtime.connect();

export function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [chromeLink({ port })],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/*
          MemoryRouter: Instead of BrowserRouter.
          This is often convenient for ephemeral contexts like an extension popup.
        */}
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<SessionList />} />
            <Route path="/sessions/:sessionId" element={<SessionDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
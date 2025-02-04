// App.tsx
import { chromeLink } from "@/chromeTrpcAdditions/trpc-browser/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DownloadProgressPopup } from "./components/DownloadProgressPopup";
import Dashboard from "./routes/Dashboard";
import ModelDetail from "./routes/ModelDetail";
import SessionDetail from "./routes/SessionDetail";
import { trpc } from "./trpcClient";

const port = chrome.runtime.connect();

export function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [chromeLink({ port })],
    }),
  );

  return (
    <div className="h-[600px] w-[700px]">
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {/*
            MemoryRouter is used instead of BrowserRouter
            This is often convenient for ephemeral contexts like an extension popup.
          */}
          <DownloadProgressPopup />

          <MemoryRouter>
            <Routes>

              {/* Default dashboard that lets the user choose between Sessions and Models */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/sessions/:sessionId" element={<SessionDetail />} />
              <Route path="/models/:modelId" element={<ModelDetail />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </trpc.Provider>
    </div>
  );
}
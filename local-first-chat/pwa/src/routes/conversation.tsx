import { AIStatusCard } from '@/components/chat/AIStatusCard';
import { Sidebar } from '@/components/chat/Sidebar';
import { ConversationProvider } from '@/hooks/useConversationManager';
import { RootSchema } from '@/utils/paramValidators';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

export const Route = createFileRoute('/conversation')({
  component: RootLayout,
  validateSearch: RootSchema,
});

function RootLayout() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { sidebar } = Route.useSearch();

  // Determine sidebar state from URL search params
  const sidebarCollapsed = sidebar === 'collapsed';

  // Handle sidebar toggle
  const setSidebarCollapsed = useCallback(
    (collapsed: boolean) => {
      navigate({
        search: (curr) => ({
          sidebar: collapsed ? 'collapsed' : 'open',
        }),
      });
    },
    [navigate],
  );

  return (
    <ConversationProvider>
      <div className="flex h-screen overflow-hidden">
        <div
          className={`text-foreground flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-64'}`}
        >
          <Sidebar setSidebarCollapsed={setSidebarCollapsed} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col animate-in fade-in duration-1000">
            <Outlet />
          </div>
          <div className="animate-in fade-in duration-1000">
            <AIStatusCard />
          </div>
        </div>
      </div>
    </ConversationProvider>
  );
}

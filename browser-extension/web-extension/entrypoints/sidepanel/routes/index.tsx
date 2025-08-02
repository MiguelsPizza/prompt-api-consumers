import { Tabs, TabsList, TabsTrigger } from '@local-first-web-ai-monorepo/react-ui/components/tabs';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { LayersIcon, MessageSquareIcon } from 'lucide-react';
import { CurrentModelInfo } from '../components/CurrentModelInfo';
import { DownloadProgressPopup } from '../components/DownloadProgressPopup';

export const Route = createFileRoute('/')({
  component: RootComponent,
})

export function RootComponent() {
  return (
    <div className="flex flex-col h-full w-full">
      <DownloadProgressPopup />

      <header className="border-b py-2 px-3 sticky top-0 bg-background z-10">
        <h1 className="text-lg font-semibold">My AI Extension</h1>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="p-3 space-y-4">

          <nav className="pt-1">
            <Tabs defaultValue="sessions" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger asChild value="sessions">
                  <Link to="/sessions/list" className="flex items-center justify-center gap-1.5">
                    <MessageSquareIcon className="h-3.5 w-3.5" />
                    <span>Sessions</span>
                  </Link>
                </TabsTrigger>
                <TabsTrigger asChild value="models">
                  <Link to="/models" className="flex items-center justify-center gap-1.5">
                    <LayersIcon className="h-3.5 w-3.5" />
                    <span>Models</span>
                  </Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
          <CurrentModelInfo />
          <Outlet />
        </div>
      </div>
    </div>
  );
}

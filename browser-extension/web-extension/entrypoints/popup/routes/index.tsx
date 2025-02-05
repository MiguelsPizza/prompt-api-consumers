import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { DownloadProgressPopup } from '../components/DownloadProgressPopup';

export const Route = createFileRoute('/')({
  component: RootComponent,
})

export function RootComponent() {
  return (
    <div className="p-4">
      <DownloadProgressPopup />
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="flex space-x-2 mb-4">
        <Link to="/sessions/list" className="[&.active]:font-bold">
          Sessions
        </Link>
        <Link to="/models" className="[&.active]:font-bold">
          Models
        </Link>
      </div>
      <Outlet />
    </div>
  );
}

import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardDescription, CardHeader } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { AlertCircle, Loader2, XCircle } from "lucide-react";
import { DownloadProgressPopup } from "../components/DownloadProgressPopup";
import { CurrentModelProvider } from "../contexts/CurrentModelContext";
import { DownloadingContext } from "../contexts/downloadingContext";
import { RouterContext } from "../trpcClient";



// Use createRootRouteWithContext instead of createRootRoute
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,

  errorComponent: ({ error }) => (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-[90vw]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-2xl font-semibold tracking-tight">Error</h2>
          </div>
          <CardDescription>
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error instanceof Error && error.stack && (
            <pre className="text-xs text-muted-foreground overflow-auto h-[50vh] p-2 bg-muted rounded-md">
              {error.stack}
            </pre>
          )}
          <Button variant="default" asChild>
            <Link to="/">
              Return to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  ),

  notFoundComponent: () => (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-[380px]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight">Not Found</h2>
          </div>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button variant="default" asChild>
            <Link to="/">
              Return to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  ),
  pendingComponent: () => (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  ),
});

function RootComponent() {
  const context = useState<Boolean>(false)
  return (
    <DownloadingContext.Provider value={context}>
      <CurrentModelProvider>
        <DownloadProgressPopup />
        <Outlet />
      </CurrentModelProvider>
    </DownloadingContext.Provider >
  );
}
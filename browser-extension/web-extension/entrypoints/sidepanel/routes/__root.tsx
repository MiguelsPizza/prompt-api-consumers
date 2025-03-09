import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardDescription, CardHeader } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { AlertCircle, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { DownloadProgressPopup } from "../components/DownloadProgressPopup";
import { CurrentModelProvider } from "../contexts/CurrentModelContext";
import { DownloadingContext } from "../contexts/downloadingContext";
import { RouterContext } from "../trpcClient";



// Use createRootRouteWithContext instead of createRootRoute
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,

  errorComponent: ({ error }) => (
    <div className="flex h-screen items-center justify-center p-3">
      <Card className="w-full max-w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <h2 className="text-lg font-semibold tracking-tight">Error</h2>
          </div>
          <CardDescription className="text-xs">
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-2">
          {error instanceof Error && error.stack && (
            <pre className="text-xs text-muted-foreground overflow-auto max-h-[300px] p-2 bg-muted rounded-md">
              {error.stack}
            </pre>
          )}
          <Button variant="default" size="sm" asChild>
            <Link to="/">
              Return to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  ),

  notFoundComponent: () => (
    <div className="flex h-screen items-center justify-center p-3">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Not Found</h2>
          </div>
          <CardDescription className="text-xs">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-2">
          <Button variant="default" size="sm" asChild>
            <Link to="/">
              Return to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  ),
  pendingComponent: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    </div>
  ),
});

function RootComponent() {
  const context = useState<Boolean>(false)
  return (
    <DownloadingContext.Provider value={context}>
      <CurrentModelProvider>
        <div className="h-screen flex flex-col overflow-hidden bg-background">
          <DownloadProgressPopup />
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </div>
      </CurrentModelProvider>
    </DownloadingContext.Provider >
  );
}
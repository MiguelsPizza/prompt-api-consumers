import { InitProgressReport } from "@mlc-ai/web-llm";
import { useState } from "react";
import { trpc } from "../trpcClient";

// shadcn components (assuming these are exposed by your shared react-ui library)
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { Progress } from "@local-first-web-ai-monorepo/react-ui/components/progress";

export function DownloadProgressPopup() {
  const [progressState, setProgressState] = useState<InitProgressReport>({
    progress: 0,
    timeElapsed: 0,
    text: "",
  });

  // Remove the visible state since we'll show based on download progress
  trpc.languageModel.downloadProgress.useSubscription(undefined, {
    onData(progressEvent) {
      setProgressState(progressEvent);
    },
  });

  // Show when there's an active download (progress > 0 and < 1) or when starting to fetch params
  if ((progressState.progress === 0 && progressState.text !== "Start to fetch params") || progressState.progress >= 1) {
    return null;
  }

  return (
    // Add overlay wrapper
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex items-center justify-center">
          <CardTitle>Downloading Language Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center">{progressState.text}</p>
            <p className="text-center">Time Elapsed: {progressState.timeElapsed.toFixed(2)} sec</p>
            <Progress value={Math.min(Math.max(progressState.progress * 100, 0), 100)} />
            <p className="text-center text-sm text-muted-foreground">
              {(progressState.progress * 100).toFixed(1)}% complete
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
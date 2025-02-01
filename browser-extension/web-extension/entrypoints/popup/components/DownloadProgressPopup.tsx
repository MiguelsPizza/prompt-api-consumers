import { InitProgressReport } from "@mlc-ai/web-llm";
import { useState } from "react";
import { trpc } from "../trpcClient";

// shadcn components (assuming these are exposed by your shared react-ui library)
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { Progress } from "@local-first-web-ai-monorepo/react-ui/components/progress";

export function DownloadProgressPopup() {
  const [progressState, setProgressState] = useState<InitProgressReport>({
    progress: 0,
    timeElapsed: 0,
    text: "",
  });

  // We'll optionally allow the user to close/hide the popup in local state
  const [visible, setVisible] = useState(true);

  // Listen to the subscription from our languageModelRouter.downloadProgress procedure
  trpc.languageModel.downloadProgress.useSubscription(undefined, {
    onData(progressEvent) {
      setProgressState(progressEvent);
    },
  });

  if (!visible) {
    return null; // If closed, don't render
  }

  return (
    <Card className="w-full sm:w-80 p-4 shadow">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Download Progress</CardTitle>
        <Button variant="outline" onClick={() => setVisible(false)}>
          Close
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">{progressState.text}</p>
          <p className="text-sm">Time Elapsed: {progressState.timeElapsed.toFixed(2)} sec</p>
          {/*
            shadcn/ui standard progress bar typically expects a value from 0-100.
            If progress is a fraction between 0 and 1, multiply by 100.
          */}
          <Progress value={Math.min(Math.max(progressState.progress * 100, 0), 100)} />
          <p className="text-xs text-muted-foreground">
            {(progressState.progress * 100).toFixed(1)}% complete
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
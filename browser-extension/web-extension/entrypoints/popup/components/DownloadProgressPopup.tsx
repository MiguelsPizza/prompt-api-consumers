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

  trpc.languageModel.downloadProgress.useSubscription(undefined, {
    onData(progressEvent) {
      setProgressState(progressEvent);
    },
  });

  // Helper function to clean up and format the status text
  const getStatusText = () => {
    const text = progressState?.text;
    if (!text) return ''
    if (text.includes("Fetching param cache")) {
      // Extract key information using regex
      const mbMatch = text.match(/(\d+)MB fetched/);
      const stepMatch = text.match(/cache\[(\d+)\/(\d+)\]/);
      const percentMatch = text.match(/(\d+)% complete/);

      return [
        `Fetching model parameters (${stepMatch?.[1] || '?'}/${stepMatch?.[2] || '?'})`,
        mbMatch ? `${mbMatch[1]}MB downloaded` : '',
        percentMatch ? `${percentMatch[1]}% complete` : ''
      ].filter(Boolean).join(' • ');
    }

    if (text.includes("Loading model from cache")) {
      const stepMatch = text.match(/cache\[(\d+)\/(\d+)\]/);
      const mbMatch = text.match(/(\d+)MB loaded/);

      return [
        `Loading from cache (${stepMatch?.[1] || '?'}/${stepMatch?.[2] || '?'})`,
        mbMatch ? `${mbMatch[1]}MB loaded` : ''
      ].filter(Boolean).join(' • ');
    }

    if (text.includes("Loading GPU shader")) {
      const moduleMatch = text.match(/modules\[(\d+)\/(\d+)\]/);
      return `Loading GPU shaders (${moduleMatch?.[1] || '?'}/${moduleMatch?.[2] || '?'})`;
    }

    return text;
  };

  // Show when there's an active download or initialization
  if (progressState.progress >= 1 || (progressState.progress === 0 && !progressState.text)) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex items-center justify-center">
          <CardTitle>Loading Language Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center">{getStatusText()}</p>
            <Progress value={Math.min(Math.max(progressState.progress * 100, 0), 100)} />
            <p className="text-center text-sm text-muted-foreground">
              {progressState.progress < 1 && `${(progressState.progress * 100).toFixed(0)}% complete`}
              {progressState.timeElapsed > 0 && ` • ${progressState.timeElapsed.toFixed(1)}s`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
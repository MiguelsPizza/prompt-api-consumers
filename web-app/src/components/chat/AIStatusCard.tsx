import { AlertCircle, Download, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { CreateConversationCard } from './CreateConversationCard';
import { DownloadProgress } from '@/types/ai';

interface AIStatusCardProps {
  error: Error | null;
  available: AICapabilityAvailability
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  startDownload: () => void;
  cancelDownload: () => void;
  onNewConversation: () => void;
}

export function AIStatusCard({
  error,
  available,
  isDownloading,
  downloadProgress,
  startDownload,
  cancelDownload,
  onNewConversation,
}: AIStatusCardProps) {
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-[400px]">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (available === 'after-download') {
    return (
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Download Required</CardTitle>
          <CardDescription>
            The AI model needs to be downloaded before you can start chatting
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isDownloading && downloadProgress && (
            <div className="space-y-2">
              <Progress value={(downloadProgress.loaded / downloadProgress.total) * 100} />
              <p className="text-sm text-muted-foreground">
                {Math.round((downloadProgress.loaded / downloadProgress.total) * 100)}%
              </p>
            </div>
          )}
          <div className="flex justify-center gap-2">
            {!isDownloading ? (
              <Button onClick={startDownload} className="flex gap-2">
                <Download className="h-5 w-5" />
                Download Model
              </Button>
            ) : (
              <Button onClick={cancelDownload} variant="destructive" className="flex gap-2">
                <XCircle className="h-5 w-5" />
                Cancel Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <CreateConversationCard onNewConversation={onNewConversation} />;
}
import { AlertCircle, AlertTriangle, Check, ChevronDown, Chrome, Copy, Download, ExternalLink, Globe, Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { useAICapabilities } from 'use-prompt-api';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function AIStatusCard() {
  const [showSetup, setShowSetup] = useState(false);

  const {
    available,
    error,
    downloadProgress,
    isDownloading,
    startDownload,
    cancelDownload,
  } = useAICapabilities();

  const { toast } = useToast();


  const isChrome = navigator.userAgent.indexOf("Chrome") > -1;
  const chromeVersion = parseInt((navigator.userAgent.match(/Chrome\/([0-9]+)/) || [])[1] || '0');
  const isCompatibleVersion = chromeVersion >= 128;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: text,
      duration: 3000,
    });
  };

  if (error?.name === 'AICapabilityError' && error.code === 'API_UNAVAILABLE') {
    return (
      <AlertDialog defaultOpen open>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              AI Model Setup Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              To use the AI features, you'll need to set up the model in Chrome. Choose one of the options below to get started.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-6">
            {/* Main Setup Option */}
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Chrome className="h-5 w-5" />
                    Chrome Browser Setup
                  </h3>

                  {/* Replace the existing button with this new section */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setShowSetup(!showSetup)}
                    >
                      Alternative Setup
                      <ChevronDown className="h-4 w-4" />
                    </Button>

                    {showSetup && (
                      <div className="absolute right-0 top-full mt-2 z-50 bg-popover p-4 rounded-lg border shadow-lg w-[300px]">
                        <h4 className="font-medium mb-2">Chrome Extension</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Use our polyfill extension to connect this UI with any LLM - local or cloud-based.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open('mailto:alexmnahas@gmail.com?subject=Chrome Extension Beta Access Request', '_blank')}
                        >
                          Request Beta Access
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirements Check */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {isChrome ?
                      <Check className="h-4 w-4 text-green-500" /> :
                      <XCircle className="h-4 w-4 text-red-500" />
                    }
                    <span>Chrome Browser Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompatibleVersion ?
                      <Check className="h-4 w-4 text-green-500" /> :
                      <XCircle className="h-4 w-4 text-red-500" />
                    }
                    <span>Chrome v128+ Required (Current: v{chromeVersion})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span>22GB+ Free Storage Required</span>
                  </div>
                </div>

                {/* Setup Steps */}
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Setup Steps</h4>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          1
                        </div>
                        <div>
                          <h5 className="font-medium">Enable Model Support</h5>
                          <p className="text-sm text-muted-foreground mb-2">
                            Copy and paste this URL in Chrome, then enable "BypassPerfRequirement"
                          </p>
                          <Button
                            onClick={() => copyToClipboard('chrome://flags/#optimization-guide-on-device-model')}
                            variant="secondary"
                            className="h-8 text-sm"
                          >
                            Copy URL <Copy className="ml-2 h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          2
                        </div>
                        <div>
                          <h5 className="font-medium">Enable Prompt API</h5>
                          <p className="text-sm text-muted-foreground mb-2">
                            Copy and paste this URL, enable the flag, then restart Chrome
                          </p>
                          <Button
                            onClick={() => copyToClipboard('chrome://flags/#prompt-api-for-gemini-nano')}
                            variant="secondary"
                            className="h-8 text-sm"
                          >
                            Copy URL <Copy className="ml-2 h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          3
                        </div>
                        <div>
                          <h5 className="font-medium">Update Components</h5>
                          <p className="text-sm text-muted-foreground mb-2">
                            Check for Gemini Nano updates (version ≥2024.5.21.1031)
                          </p>
                          <Button
                            onClick={() => copyToClipboard('chrome://components')}
                            variant="secondary"
                            className="h-8 text-sm"
                          >
                            Copy URL <Copy className="ml-2 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <Button
                    onClick={() => window.open('https://developer.chrome.com/docs/ai/built-in#get_an_early_preview', '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Handle other errors
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-[400px]">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{error.name}</AlertTitle>
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
}
import type { SessionMessage } from '@/entrypoints/background/lib/sessionSchema';
import { AssistantRuntimeProvider, useExternalStoreRuntime } from '@assistant-ui/react';
import { Alert, AlertDescription, AlertTitle } from "@local-first-web-ai-monorepo/react-ui/components/alert";
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UUID } from "crypto";
import { Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MyThread } from '../../../../../packages/react-ui/src/components/thread';
import { cn } from '../../../../../packages/react-ui/src/components/utils';
import { trpc } from "../trpcClient";
import { SessionDetailValidator } from "../utils/paramValidators";

// If you want a separate Not Found component:
function NotFoundAlert() {
  return (
    <Alert variant="destructive">
      <AlertTitle>Not Found</AlertTitle>
      <AlertDescription>Session not found.</AlertDescription>
    </Alert>
  );
}

// Add this component after NotFoundAlert
function PendingComponent() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">Loading session...</p>
    </div>
  );
}

export const Route = createFileRoute('/sessions/$sessionId')({
  loader: async ({ params, context }) => {
    const { sessionId } = params;

    if (!sessionId) {
      throw new Error("SessionId is required");
    }

    // Call your TRPC queries *from* the router's context:
    const data = await context.trpc.sessions.getSessionWithMessages.query({ sessionId: sessionId as UUID });
    if (!data) throw new Error(`Session: ${sessionId} not found`)

    return {
      session: data.session,
      messages: data.messages,
    };
  },
  pendingComponent: PendingComponent,
  component: SessionDetailComponent,
  validateSearch: SessionDetailValidator.search,
  notFoundComponent: NotFoundAlert,
});


function SessionDetailComponent() {
  const { sessionId } = Route.useParams();
  const { messages: initialMessage, session } = Route.useLoaderData()
  const navigate = useNavigate();
  const [messages, setMessages] = useState<SessionMessage[]>(initialMessage)
  const [isRunning, setIsRunning] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Fetch session + messages
  trpc.sessions.sessionLive.useSubscription(
    { sessionId: sessionId as UUID },
    {
      onData: ({ messages: newMessages, session: newSessions }) => {
        setMessages(newMessages ?? [])
      },
      enabled: Boolean(sessionId),
      onError: console.error,
    }
  );


  const chatWithModelMutation = trpc.languageModel._promptStreamingInternal.useMutation()


  // chatWithModelMutation.useSubscription({
  //   messages: [{ content: message.content[0].text, role: 'user' }],
  //   sessionId
  // }, {});

  // Rename session mutation
  const updateSessionMutation = trpc.sessions.update.useMutation();
  // Delete session mutation
  const deleteSessionMutation = trpc.sessions.destroy.useMutation();

  const handleRenameSession = async () => {
    // const newName = window.prompt('Enter new session name:', session?.name || '');
    // if (newName && session) {
    //   await updateSessionMutation.mutateAsync({
    //     sessionId: session.id,
    //     name: newName,
    //   });
    // }
  };

  const handleDeleteSession = async () => {
    if (session) {
      if (confirm('Are you sure you want to delete this session?')) {
        await deleteSessionMutation.mutateAsync({ sessionId: session.id });
        navigate({ to: '/sessions' });
      }
    }
  };

  const runtime = useExternalStoreRuntime<SessionMessage>({
    isRunning: isRunning,
    messages: messages,
    onNew: async (message) => {
      if (!sessionId) return;
      if (message.content[0]?.type !== 'text') {
        throw new Error('Only text messages are supported');
      }
      setIsRunning(true)
      await chatWithModelMutation.mutateAsync({
        sessionId: sessionId,
        messages: [{ role: 'user', content: message.content[0].text }]
      })
      setIsRunning(false)

    },
    onEdit: async (message) => {
      // Implement edit functionality if needed
      console.log('Edit not implemented', message);
    },
    onCancel: async () => {
      // Implement cancel functionality if needed
      console.log('Cancel not implemented');
    },
    onReload: async (parentId) => {
      // Implement reload functionality if needed
      console.log('Reload not implemented', parentId);
    },
    convertMessage: (message) => ({
      metadata: {
        custom: {
          id: message.id,
        }
      },
      role: message.role === 'user' || message.role === 'assistant' ? message.role : 'user',
      content: [{ type: 'text', text: message.content }],
      id: message.id,
      // Add created_at if your messages have timestamps
    }),
  });

  // Add useEffect and click handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const infoPanel = document.getElementById('info-panel');
      const infoButton = document.getElementById('info-button');

      if (isInfoOpen &&
        infoPanel &&
        !infoPanel.contains(event.target as Node) &&
        !infoButton?.contains(event.target as Node)) {
        setIsInfoOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isInfoOpen]);

  return (
    <div className="p-4 relative h-full">
      {/* Update Info Button with id */}
      <Button
        id="info-button"
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50"
        onClick={() => setIsInfoOpen(!isInfoOpen)}
      >
        <Info className="h-5 w-5" />
      </Button>

      {/* Add id to the info panel */}
      <div
        id="info-panel"
        className={cn(
          "absolute right-0 top-0 h-full w-80 bg-background border-l transform transition-transform duration-200 ease-in-out z-40 overflow-y-auto",
          isInfoOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <Card className="h-full rounded-none border-0">
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Name:</span> {session.name || '(no name)'}
            </div>
            <div className="text-sm">
              <span className="font-medium">ID:</span> {session.id}
            </div>
            <div className="flex flex-col space-y-2 mt-4">
              <Button variant="secondary" onClick={handleRenameSession}>
                Rename Session
              </Button>
              <Button variant="destructive" onClick={handleDeleteSession}>
                Delete Session
              </Button>
              <Button variant="outline" asChild>
                <Link to="/sessions/list">Back</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="h-[500px] w-full overflow-hidden">
        <AssistantRuntimeProvider runtime={runtime}>
          <MyThread />
        </AssistantRuntimeProvider>
      </div>
    </div>
  );
}


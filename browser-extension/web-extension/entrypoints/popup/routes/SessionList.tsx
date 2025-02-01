import type { BaseSession } from "@/background/lib/sessionSchema";
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { ScrollArea } from "@local-first-web-ai-monorepo/react-ui/components/scroll-area";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../trpcClient";

/**
 * SessionList: Show a list of sessions with live updates.
 * We can also create a new session here.
 */
export default function SessionList() {
  const [sessions, setSessions] = useState<BaseSession[]>([])
  // Subscription to all sessions:
  trpc.sessions.allLive.useSubscription(undefined, {
    onData: (data) => setSessions(data),
    onError: (err) => console.error('Subscription error:', err),
  });

  // Create a new session mutation:
  const createSessionMutation = trpc.sessions.create.useMutation();
  const navigate = useNavigate();

  // Create new session handler:
  const handleCreateSession = async () => {
    const sessionId = crypto.randomUUID();
    await createSessionMutation.mutateAsync({
      sessionId,
      name: `Session ${sessionId.slice(0, 4)}`,
      hostURL: 'popup',
      llm_id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', // or whichever default model you want
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      topK: 40,
    });
    // Navigate to new session detail page:
    navigate(`/sessions/${sessionId}`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Button onClick={handleCreateSession}>
          Create New Session
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Available Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {sessions?.length ? (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <Card key={session.id} className="hover:bg-accent transition-colors">
                    <CardContent className="p-4">
                      <Link
                        to={`/sessions/${session.id}`}
                        className="flex items-center justify-between"
                      >
                        <span className="font-medium">{session.name || '(Unnamed)'}</span>
                        <span className="text-sm text-muted-foreground">ID: {session.id}</span>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">No sessions yet.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
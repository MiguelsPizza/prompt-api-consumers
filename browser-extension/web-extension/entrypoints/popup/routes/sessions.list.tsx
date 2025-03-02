import type { BaseSession } from '@/entrypoints/background/lib/sessionSchema'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@local-first-web-ai-monorepo/react-ui/components/card'
import { ScrollArea } from '@local-first-web-ai-monorepo/react-ui/components/scroll-area'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '../trpcClient'

export const Route = createFileRoute('/sessions/list')({
  component: SessionListComponent,
})

function SessionListComponent() {
  const [sessions, setSessions] = useState<BaseSession[]>([])
  // Subscription to all sessions:
  trpc.sessions.allLive.useSubscription(undefined, {
    onData: (data) => setSessions(data),
    onError: (err) => console.error('Subscription error:', err),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {sessions?.length ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="hover:bg-accent transition-colors"
                >
                  <CardContent className="p-4">
                    <Link
                      onClick={() => console.log({ sessionId: session.id })}
                      to="/sessions/$sessionId"
                      params={{ sessionId: session.id }}
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium">
                        {session.name || '(Unnamed)'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ID: {session.id}
                      </span>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">
              No sessions yet.
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

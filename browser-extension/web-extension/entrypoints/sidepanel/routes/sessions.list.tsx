import type { BaseSession } from '@/entrypoints/background/lib/sessionSchema'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@local-first-web-ai-monorepo/react-ui/components/card'
import { ScrollArea } from '@local-first-web-ai-monorepo/react-ui/components/scroll-area'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Loader2, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { trpc } from '../trpcClient'

export const Route = createFileRoute('/sessions/list')({
  component: SessionListComponent,
})

function SessionListComponent() {
  const [sessions, setSessions] = useState<BaseSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Subscription to all sessions:
  trpc.sessions.allLive.useSubscription(undefined, {
    onData: (data) => {
      setSessions(data)
      setIsLoading(false)
    },
    onError: (err) => {
      console.error('Subscription error:', err)
      setIsLoading(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          Sessions
          {sessions?.length > 0 && (
            <Card className="text-xs font-normal">
              {sessions.length}
            </Card>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <ScrollArea className="h-[300px] pr-2">
          {sessions?.length ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <CardContent className="p-2">
                    <Link
                      to="/sessions/$sessionId"
                      params={{ sessionId: session.id }}
                      className="flex flex-col"
                    >
                      <span className="font-medium text-sm truncate">
                        {session.name || '(Unnamed Session)'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        ID: {session.id.substring(0, 8)}...
                      </span>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  No sessions available
                </p>
              </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

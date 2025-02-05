import { Button } from '@local-first-web-ai-monorepo/react-ui/components/button'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { trpc } from '../trpcClient'

export const Route = createFileRoute('/sessions')({
  component: SessionListComponent,
})

function SessionListComponent() {
  const navigate = Route.useNavigate()
  const createSessionMutation = trpc.sessions.create.useMutation()

  // Create new session handler:
  const handleCreateSession = async () => {
    const sessionId = crypto.randomUUID()
    await createSessionMutation.mutateAsync({
      sessionId,
      name: `Session ${sessionId.slice(0, 4)}`,
      hostURL: 'popup',
      llm_id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      topK: 40,
    })
    navigate({
      to: '/sessions/$sessionId',
      params: { sessionId }
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Button onClick={handleCreateSession}>Create New Session</Button>
      </div>
      <Outlet />
    </div>
  )
}

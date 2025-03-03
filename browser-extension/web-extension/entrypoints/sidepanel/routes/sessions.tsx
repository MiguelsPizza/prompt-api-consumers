import { Button } from '@local-first-web-ai-monorepo/react-ui/components/button'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { useCurrentModel } from '../contexts/CurrentModelContext'
import { trpc } from '../trpcClient'

export const Route = createFileRoute('/sessions')({
  component: SessionListComponent,
})

function SessionListComponent() {
  const navigate = Route.useNavigate()
  const { currentModel } = useCurrentModel();

  const createSessionMutation = trpc.sessions.create.useMutation()

  // Create new session handler:
  const handleCreateSession = async () => {
    const sessionId = crypto.randomUUID()
    await createSessionMutation.mutateAsync({
      sessionId,
      name: `Session ${sessionId.slice(0, 4)}`,
      hostURL: 'popup',
      llm_id: currentModel ?? 'Hermes-2-Theta-Llama-3-8B-q4f16_1-MLC',
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
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-2">
            <Link
              to='/'
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </Link>
            <Link
              to='/models'
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Models
            </Link>
          </nav>
          <Button
            onClick={handleCreateSession}
            className="inline-flex items-center gap-2 bg-primary"
          >
            <PlusIcon className="w-4 h-4" />
            New Session
          </Button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

import { SupportedLLMModel } from '@/entrypoints/background/lib/supportedModels'
import { trpc } from '@/entrypoints/sidepanel/trpcClient'
import { Alert, AlertDescription, AlertTitle } from '@local-first-web-ai-monorepo/react-ui/components/alert'
import { Button } from '@local-first-web-ai-monorepo/react-ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@local-first-web-ai-monorepo/react-ui/components/card'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { filesize } from 'filesize'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'
import { useModels } from '../hooks/useModels'

// Define search params schema
const ModelDetailSearchSchema = z.object({
  view: z.enum(['info', 'settings']).optional(),
})

export const Route = createFileRoute('/models/$modelId')({
  validateSearch: zodValidator(ModelDetailSearchSchema),
  component: ModelDetail,
  errorComponent: ({ error }) => (
    <Alert variant="destructive">
      <AlertTitle>Model Not Found</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      <Link to="/models">
        <Button variant="outline" className="mt-4">Back to Models</Button>
      </Link>
    </Alert>
  ),
})

function ModelDetail() {
  const { modelId } = Route.useParams()
  const router = useRouter()
  const deleteModelMutation = trpc.models.deleteModel.useMutation()
  const { models, isLoading } = useModels()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading model details...</p>
        </div>
      </div>
    )
  }

  const modelDetail = models[modelId as SupportedLLMModel]
  if (!modelDetail) {
    throw new Error(`Model ${modelId} not found`)
  }

  const handleDeleteModel = async () => {
    if (confirm(`Are you sure you want to delete model "${modelId}" from the cache?`)) {
      try {
        await deleteModelMutation.mutateAsync({ modelId: modelId as SupportedLLMModel })
        router.navigate({ to: '/models' })
      } catch (err) {
        console.error("Error deleting model:", err)
      }
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Model Detail</h1>
      <Card>
        <CardHeader>
          <CardTitle>{modelId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Manifest URL:</strong> {modelDetail.model}
          </div>
          <div>
            <strong>Total Size:</strong> {filesize(modelDetail.vram_required_MB!, { exponent: 2 })}
          </div>
          {/* Additional details about the model can be displayed here */}
          <div className="flex space-x-2 mt-4">
            <Button variant="destructive" onClick={handleDeleteModel}>
              Delete Model
            </Button>
            <Button variant="outline" asChild>
              <Link to="/models">Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import { trpc } from '@/entrypoints/sidepanel/trpcClient'
import { Alert, AlertDescription, AlertTitle } from '@local-first-web-ai-monorepo/react-ui/components/alert'
import { Button } from '@local-first-web-ai-monorepo/react-ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@local-first-web-ai-monorepo/react-ui/components/card'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { filesize } from 'filesize'

export const Route = createFileRoute('/models/$modelId')({
  loader: async ({ params: { modelId }, context: { trpc } }) => {
    const models = await trpc.models.listModels.query()
    const modelDetail = models.find((m) => m.model_id === modelId)

    if (!modelDetail) {
      throw new Error(`Model ${modelId} not found`)
    }

    return { modelDetail }
  },
  component: ModelDetail,
  errorComponent: ({ error }) => {
    return (
      <Alert variant="destructive">
        <AlertTitle>Model Not Found</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
        <Link to="/models">
          <Button variant="outline">Back to Models</Button>
        </Link>
      </Alert>
    )
  }
})

function ModelDetail() {
  const { modelDetail } = Route.useLoaderData()
  const { modelId } = Route.useParams()
  console.log({ modelDetail, modelId })

  const router = useRouter()
  const deleteModelMutation = trpc.models.deleteModel.useMutation()

  const handleDeleteModel = async () => {
    if (confirm(`Are you sure you want to delete model "${modelId}" from the cache?`)) {
      try {
        await deleteModelMutation.mutateAsync({ modelId: modelId })
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
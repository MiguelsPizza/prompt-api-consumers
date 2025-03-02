import { Button } from '@local-first-web-ai-monorepo/react-ui/components/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@local-first-web-ai-monorepo/react-ui/components/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@local-first-web-ai-monorepo/react-ui/components/tabs'

import { ValidatedModelRecord } from '@/entrypoints/background/lib/modelUtils'
import { detectGPUDevice } from '@mlc-ai/web-runtime'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { AvailableModelsList } from '../components/AvailableModelsList'
import { CachedModelsList } from '../components/CachedModelsList'
import { StorageUsageChart } from '../components/StorageUsageChart'
import { useStorageInfo } from '../hooks/useStorageInfo'
import { trpc } from '../trpcClient'
import { fetchGPUDB, getCompatibleLLMs } from '../utils/clientHardwareUtils'

const PendingComponent = () => (<div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4">
  <div className="animate-spin">
    <Loader2 className="h-8 w-8 text-gray-400" />
  </div>
  <p className="text-sm text-gray-600">Loading models...</p>
</div>)

export const Route = createFileRoute('/models')({
  loader: async ({ context: { trpc } }) => {
    // Fetch data in parallel
    const [gpuInfo, gpuDB] = await Promise.all([
      navigator.gpu ? detectGPUDevice() : null,
      navigator.onLine ? fetchGPUDB() : null,
    ])

    const validLLMs = gpuInfo && gpuDB ? await getCompatibleLLMs(gpuDB, gpuInfo) : null

    return {
      validLLMs,
      gpuInfo,
      gpuDB
    }
  },
  component: ModelList,
  pendingComponent: PendingComponent
})

function ModelList() {

  const { data: models, isLoading } = trpc.models.listModels.useQuery(undefined, {
    initialData: [], // Use loader data as initial data
    refetchInterval: 500
  })

  const [showChart, setShowChart] = useState(true)
  const [hoveredModel, setHoveredModel] = useState<ValidatedModelRecord | null>(null)
  const storageInfo = useStorageInfo()

  if (isLoading) return PendingComponent

  return (
    <Collapsible open={showChart} onOpenChange={setShowChart}>

      <div className="p-4 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Models</h1>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              {showChart ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </Button>
            </CollapsibleTrigger>
        </div>
          <nav className="flex items-center gap-3">
            <Link
              to="/sessions"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sessions
            </Link>
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </Link>
          </nav>
        </header>

        <main className="flex gap-6">
          <section className="w-1/2">
            <CollapsibleContent>
              <StorageUsageChart
                hoveredModel={hoveredModel}
                models={models}
                storageInfo={storageInfo}
              />
            </CollapsibleContent>
          </section>

          <section className="w-1/2">
            <Tabs defaultValue="cached" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cached">Cached Models</TabsTrigger>
                <TabsTrigger value="available">Available Models</TabsTrigger>
              </TabsList>
              <TabsContent value="cached" className="mt-4">
                <CachedModelsList models={models} />
              </TabsContent>
              <TabsContent value="available" className="mt-4">
                <AvailableModelsList
                  setHoveredModel={setHoveredModel}
                  models={models}
                  storageInfo={storageInfo}
                />
              </TabsContent>
            </Tabs>
          </section>
        </main>
      </div>
    </Collapsible>
  )
}
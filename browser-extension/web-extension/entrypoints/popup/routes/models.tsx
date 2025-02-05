import { Button } from '@local-first-web-ai-monorepo/react-ui/components/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@local-first-web-ai-monorepo/react-ui/components/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@local-first-web-ai-monorepo/react-ui/components/tabs'

import { ModelRecord } from '@mlc-ai/web-llm'
import { detectGPUDevice } from '@mlc-ai/web-runtime'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { AvailableModelsList } from '../components/AvailableModelsList'
import { CachedModelsList } from '../components/CachedModelsList'
import { StorageUsageChart } from '../components/StorageUsageChart'
import { useStorageInfo } from '../hooks/useStorageInfo'
import { fetchGPUDB, getCompatibleLLMs } from '../utils/clientHardwareUtils'

export const Route = createFileRoute('/models')({
  loader: async ({ context: { trpc } }) => {
    // Fetch data in parallel
    const [gpuInfo, gpuDB, models] = await Promise.all([
      navigator.gpu ? detectGPUDevice() : null,
      navigator.onLine ? fetchGPUDB() : null,
      trpc.models.listModels.query()
    ])

    const validLLMs = gpuInfo && gpuDB ? await getCompatibleLLMs(gpuDB, gpuInfo) : null

    return {
      models,
      validLLMs,
      gpuInfo,
      gpuDB
    }
  },
  component: ModelList
})

function ModelList() {
  const { models } = Route.useLoaderData()
  const [showChart, setShowChart] = useState(true)
  const [hoveredModel, setHoveredModel] = useState<ModelRecord | null>(null)
  const storageInfo = useStorageInfo()

  return (
    <div className="p-4">
      <Collapsible open={showChart} onOpenChange={setShowChart}>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Models</h1>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {showChart ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <CollapsibleContent>
              <StorageUsageChart hoveredModel={hoveredModel} models={models} storageInfo={storageInfo} />
            </CollapsibleContent>
          </div>

          <div className="w-1/2">
            <Tabs defaultValue="cached" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cached">Cached Models</TabsTrigger>
                <TabsTrigger value="available">Available Models</TabsTrigger>
              </TabsList>
              <TabsContent value="cached" className="mt-4">
                <CachedModelsList models={models} />
              </TabsContent>
              <TabsContent value="available" className="mt-4">
                <AvailableModelsList setHoveredModel={setHoveredModel} models={models} storageInfo={storageInfo} />
              </TabsContent>
            </Tabs>
          </div>

        </div>
      </Collapsible>
    </div>
  )
}
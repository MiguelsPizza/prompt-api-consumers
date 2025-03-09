import { Button } from '@local-first-web-ai-monorepo/react-ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@local-first-web-ai-monorepo/react-ui/components/tabs'

import { ValidatedModelRecord } from '@/entrypoints/background/lib/modelUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@local-first-web-ai-monorepo/react-ui/components/card'
import { detectGPUDevice } from '@mlc-ai/web-runtime'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, HardDriveIcon, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { AvailableModelsList } from '../components/AvailableModelsList'
import { CachedModelsList } from '../components/CachedModelsList'
import { StorageUsageChart } from '../components/StorageUsageChart'
import { useModels } from '../hooks/useModels'
import { useStorageInfo } from '../hooks/useStorageInfo'
import { fetchGPUDB, getCompatibleLLMs } from '../utils/clientHardwareUtils'

const PendingComponent = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-4 space-y-3">
    <div className="animate-spin">
      <Loader2 className="h-6 w-6 text-gray-400" />
    </div>
    <p className="text-xs text-gray-600">Loading models...</p>
  </div>
)

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
  const { models, isLoading } = useModels()
  const [showChart, setShowChart] = useState(true)
  const [hoveredModel, setHoveredModel] = useState<ValidatedModelRecord | null>(null)
  const storageInfo = useStorageInfo()

  if (isLoading) return <PendingComponent />
  const modelList = Object.values(models)
  return (
    <div className="space-y-3">
      {/* Storage usage visualization */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <HardDriveIcon className="h-3.5 w-3.5" />
              Storage Usage
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowChart(!showChart)}
            >
              {showChart ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-600" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
              )}
            </Button>
          </div>
        </CardHeader>
        {showChart && (
          <CardContent className="px-3 pb-3 pt-0">
            <StorageUsageChart
              hoveredModel={hoveredModel}
              models={modelList}
              storageInfo={storageInfo}
            />
          </CardContent>
        )}
      </Card>

      {/* Models tabs */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="available" className="text-xs">Available</TabsTrigger>
          <TabsTrigger value="cached" className="text-xs">Cached</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="mt-2 pt-0">
          <AvailableModelsList
            models={modelList}
            setHoveredModel={setHoveredModel}
            storageInfo={storageInfo}
          />
        </TabsContent>
        <TabsContent value="cached" className="mt-2 pt-0">
          <CachedModelsList models={modelList} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
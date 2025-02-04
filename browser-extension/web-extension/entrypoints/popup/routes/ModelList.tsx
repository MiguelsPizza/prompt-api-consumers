// ModelList.tsx
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@local-first-web-ai-monorepo/react-ui/components/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@local-first-web-ai-monorepo/react-ui/components/tabs";
import { ModelRecord } from "@mlc-ai/web-llm";
import { detectGPUDevice } from "@mlc-ai/web-runtime";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { AvailableModelsList } from "../components/AvailableModelsList";
import { CachedModelsList } from "../components/CachedModelsList";
import { StorageUsageChart } from "../components/StorageUsageChart";
import { useStorageInfo } from "../hooks/useStorageInfo";
import { trpc } from "../trpcClient";
import { fetchGPUDB, getCompatibleLLMs } from "../utils/clientHardwareUtils";


export default function ModelList() {
  const [showChart, setShowChart] = useState(true);
  const [hoveredModel, setHoveredModel] = useState<ModelRecord | null>(null);
  const storageInfo = useStorageInfo();

  const [{ data: gpuInfo }, { data: gpuDB }] = useQueries({
    queries: [{
      queryFn: detectGPUDevice,
      enabled: !!navigator.gpu,
      queryKey: ['GPU']
    },
    {
      queryFn: fetchGPUDB,
      enabled: !!navigator.onLine,
      queryKey: ['GPUDB']
    }
    ]
  })



  const { data: validLLms } = useQuery({
    enabled: !!gpuInfo && !!gpuDB,
    queryFn: () => getCompatibleLLMs(gpuDB, gpuInfo),
  })
  console.log({ validLLms })

  // Subscribe to live updates from our TRPC model router
  const { data: models, isLoading } = trpc.models.listModels.useQuery(undefined, { initialData: [] })

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
  );
}
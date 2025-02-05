// ModelList.tsx
import { Collapsible } from "@local-first-web-ai-monorepo/react-ui/components/collapsible";
import { ModelRecord } from "@mlc-ai/web-llm";
import { detectGPUDevice } from "@mlc-ai/web-runtime";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useStorageInfo } from "../entrypoints/popup/hooks/useStorageInfo";
import { trpc } from "../entrypoints/popup/trpcClient";
import { fetchGPUDB, getCompatibleLLMs } from "../entrypoints/popup/utils/clientHardwareUtils";


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

      </Collapsible>
    </div>
  );
}


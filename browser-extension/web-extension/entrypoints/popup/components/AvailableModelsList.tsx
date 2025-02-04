import type { CachedModel } from "@/background/lib/modelUtils";
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { ScrollArea } from "@local-first-web-ai-monorepo/react-ui/components/scroll-area";
import { ModelRecord } from "@mlc-ai/web-llm";
import { trpc } from "../trpcClient";
import { AVAILABLE_MODELS } from "../utils/clientHardwareUtils";

interface AvailableModelsListProps {
  models: CachedModel[];
  storageInfo: { used: number; available: number } | null;
  setHoveredModel: (prev: ModelRecord) => void
}


export function AvailableModelsList({ models, storageInfo, setHoveredModel }: AvailableModelsListProps) {

  const downloadModel = trpc.models.downloadModel.useMutation()

  const handleDownloadModel = async (model: ModelRecord) => {
    const test = await downloadModel.mutateAsync({
      modelId: model.model_id
    })
    console.log({ test })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Models</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {AVAILABLE_MODELS.map((model) => {
              const isModelCached = models.map(a => a.manifestUrl).includes(model.model);
              const modelSizeMB = model.vram_required_MB || 0;

              return (
                <Card
                  key={model.model_id}
                  className="hover:bg-accent transition-colors relative group"
                  onMouseEnter={() => setHoveredModel(model)}
                  onMouseLeave={() => setHoveredModel(model)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {model.model_id}
                        {isModelCached && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Type: {model.model_type || 'LLM'}</div>
                        {model.low_resource_required && (
                          <div className="text-green-600">Low Resource Compatible</div>
                        )}
                        <div>VRAM Required: {modelSizeMB} MB</div>
                      </div>
                    </div>

                    {!isModelCached && (
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadModel(model)}
                      >
                        Download
                      </Button>
                    )}

                    <StorageImpactTooltip
                      modelSizeMB={modelSizeMB}
                      storageInfo={storageInfo}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card >
  );
}

interface StorageImpactTooltipProps {
  modelSizeMB: number;
  storageInfo: { used: number; available: number } | null;
}

function StorageImpactTooltip({ modelSizeMB, storageInfo }: StorageImpactTooltipProps) {
  return (
    <div className="absolute hidden group-hover:block right-0 top-0 -translate-y-full bg-background p-2 rounded-lg shadow-lg border z-10">
      <div className="text-sm">
        <div>Storage Impact:</div>
        <div className="font-medium">{modelSizeMB} MB</div>
        {storageInfo && (
          <div className="text-xs text-muted-foreground">
            {((modelSizeMB * 1024 * 1024 / storageInfo.available) * 100).toFixed(1)}% of available space
          </div>
        )}
      </div>
    </div>
  );
}
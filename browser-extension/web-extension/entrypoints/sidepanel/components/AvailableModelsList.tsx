import { ValidatedModelRecord } from "@/entrypoints/background/lib/modelUtils";
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { Input } from "@local-first-web-ai-monorepo/react-ui/components/input";
import { ScrollArea } from "@local-first-web-ai-monorepo/react-ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@local-first-web-ai-monorepo/react-ui/components/select";
import { useMemo, useState } from "react";
import { SupportedLLMModel } from '../../background/lib/supportedModels';
import { trpc } from "../trpcClient";
import { AVAILABLE_MODELS } from "../utils/clientHardwareUtils";

interface AvailableModelsListProps {
  models: ValidatedModelRecord[];
  storageInfo: { used: number; available: number } | null;
  setHoveredModel: (prev: ValidatedModelRecord | null) => void
}


export function AvailableModelsList({ models, storageInfo, setHoveredModel }: AvailableModelsListProps) {

  const downloadModel = trpc.models.downloadModel.useMutation()

  // New state for search and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "size">("name");

  const handleDownloadModel = async (model: ValidatedModelRecord) => {
    const test = await downloadModel.mutateAsync({
      modelId: model.model_id as SupportedLLMModel
    })
    console.log({ test })
  }

  // Memoized filtering and sorting
  const filteredAndSortedModels = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return AVAILABLE_MODELS
      .filter((model) => {
        // Filter by user's search
        return model.model_id.toLowerCase().includes(lowerQuery);
      })
      .sort((a, b) => {
        // Sort by "name" or by "size" (vram_required_MB)
        if (sortBy === "name") {
          return a.model_id.localeCompare(b.model_id);
        } else if (sortBy === "size") {
          const sizeA = a.vram_required_MB || 0;
          const sizeB = b.vram_required_MB || 0;
          return sizeA - sizeB;
        }
        return 0;
      });
  }, [searchQuery, sortBy]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Models</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Sort Controls */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center">
            <Select value={sortBy} onValueChange={(value: "name" | "size") => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Model Name</SelectItem>
                <SelectItem value="size">Model Size (VRAM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredAndSortedModels.map((model) => {
              const isModelCached = models.some(cachedModel => cachedModel.model_id === model.model_id)
              const modelSizeMB = model.vram_required_MB || 0;

              return (
                <Card
                  key={model.model_id}
                  className="hover:bg-accent transition-colors relative group"
                  onMouseEnter={() => setHoveredModel(model as ValidatedModelRecord)}
                  onMouseLeave={() => setHoveredModel(null)}
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
                        onClick={() => handleDownloadModel(model as ValidatedModelRecord)}
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
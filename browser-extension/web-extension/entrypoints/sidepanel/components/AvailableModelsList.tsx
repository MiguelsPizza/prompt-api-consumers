import { ValidatedModelRecord } from "@/entrypoints/background/lib/modelUtils";
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { Input } from "@local-first-web-ai-monorepo/react-ui/components/input";
import { ScrollArea } from "@local-first-web-ai-monorepo/react-ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@local-first-web-ai-monorepo/react-ui/components/select";
import { filesize } from "filesize";
import { Download, HardDriveIcon } from "lucide-react";
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
  const [hoveredModel, setHoveredModelInternal] = useState<ValidatedModelRecord | null>(null);

  // New state for search and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "size">("name");

  const handleDownloadModel = async (model: ValidatedModelRecord) => {
    const test = await downloadModel.mutateAsync({
      modelId: model.model_id as SupportedLLMModel
    })
    console.log({ test })
  }

  // Handle hover with both local and parent state
  const handleMouseEnter = (model: ValidatedModelRecord) => {
    setHoveredModelInternal(model);
    setHoveredModel(model);
  };

  const handleMouseLeave = () => {
    setHoveredModelInternal(null);
    setHoveredModel(null);
  };

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
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5">
          <HardDriveIcon className="h-3.5 w-3.5" />
          Available Models
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Search and Sort Controls */}
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
          <Select value={sortBy} onValueChange={(value: "name" | "size") => setSortBy(value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Model Name</SelectItem>
              <SelectItem value="size">Model Size</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[220px] pr-2">
          <div className="space-y-2">
            {filteredAndSortedModels.map((model) => {
              const isModelCached = models.some(cachedModel => cachedModel.model_id === model.model_id)
              const modelSizeMB = model.vram_required_MB || 0;

              return (
                <Card
                  key={model.model_id}
                  className={`transition-colors relative ${hoveredModel?.model_id === model.model_id ? 'bg-accent' : 'hover:bg-accent/50'}`}
                  onMouseEnter={() => handleMouseEnter(model as ValidatedModelRecord)}
                  onMouseLeave={handleMouseLeave}
                >
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm truncate">
                            {model.model_id}
                          </div>
                          {isModelCached && (
                            <span className="h-5 px-1 border border-gray-200 rounded-full">✓</span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className="truncate">
                            {filesize(modelSizeMB * 1024 * 1024, { exponent: 2 })}
                          </span>
                          {model.low_resource_required && (
                            <span className="ml-1 h-4 text-[10px] px-1 border border-green-500 text-green-600">
                              Low Resource
                            </span>
                          )}
                        </div>
                      </div>

                      {!isModelCached && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDownloadModel(model as ValidatedModelRecord)}
                          title="Download this model"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
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
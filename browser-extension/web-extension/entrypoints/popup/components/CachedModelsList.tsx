import { ValidatedModelRecord } from "@/entrypoints/background/lib/modelUtils";
import { ZSupportedLLMModel } from "@/entrypoints/background/lib/supportedModels";
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { ScrollArea } from "@local-first-web-ai-monorepo/react-ui/components/scroll-area";
import { Link } from "@tanstack/react-router";
import { filesize } from "filesize";
import { trpc } from "../trpcClient";

interface CachedModelsListProps {
  models: ValidatedModelRecord[];
}

export function CachedModelsList({ models = [] }: CachedModelsListProps) {
  const deleteModelMutation = trpc.models.deleteModel.useMutation();
  const setCurrentModelMutation = trpc.models.setCurrentModel.useMutation();

  const handleDeleteModel = async (modelIdOrManifestUrl: string) => {
    if (confirm(`Are you sure you want to delete model "${modelIdOrManifestUrl}" from the cache?`)) {
      try {
        const res = await deleteModelMutation.mutateAsync({ modelId: modelIdOrManifestUrl });
        console.log(res.modelId, 'deleted');
      } catch (err) {
        console.error("Error deleting model:", err);
      }
    }
  };

  const handleSetCurrent = async (modelId: string) => {
    try {
      const parsedModelId = ZSupportedLLMModel.parse(modelId.trim())
      await setCurrentModelMutation.mutateAsync(parsedModelId);
      console.log(`${modelId} is now set as current model.`);
    } catch (err) {
      console.error("Error setting current model:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cached Models List</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {models.length ? (
            <div className="space-y-2">
              {models.map((model) => {
                return (
                  <Card key={model.model_id} className="hover:bg-accent transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <Link
                        to={`/models/$modelId`}
                        params={{ modelId: model.model_id }}
                        className="flex-1"
                      >
                        <div className="font-medium">{model.model_id}</div>
                        <div className="text-sm text-muted-foreground">
                          Total Size: {filesize(model.vram_required_MB!, { exponent: 2 })}
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSetCurrent(model.model_id)}>
                          Set as Current
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteModel(model.model_id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">No models cached.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
import type { CachedModel } from "@/background/lib/modelUtils";
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { ScrollArea } from "@local-first-web-ai-monorepo/react-ui/components/scroll-area";
import { Link } from "react-router-dom";
import { trpc } from "../trpcClient";
import { extractModelId } from "../utils/modelUtils";

interface CachedModelsListProps {
  models: CachedModel[];
}

export function CachedModelsList({ models }: CachedModelsListProps) {
  const deleteModelMutation = trpc.models.deleteModel.useMutation();

  const handleDeleteModel = async (modelId: string) => {
    if (confirm(`Are you sure you want to delete model "${modelId}" from the cache?`)) {
      try {
        await deleteModelMutation.mutateAsync({ modelId });
      } catch (err) {
        console.error("Error deleting model:", err);
      }
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
                const modelId = extractModelId(model.manifestUrl);
                return (
                  <Card key={model.manifestUrl} className="hover:bg-accent transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <Link
                        to={`/models/${encodeURIComponent(modelId)}`}
                        className="flex-1"
                      >
                        <div className="font-medium">{modelId}</div>
                        <div className="text-sm text-muted-foreground">
                          Total Size: {model.totalSize} bytes
                        </div>
                      </Link>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteModel(modelId)}
                      >
                        Delete
                      </Button>
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
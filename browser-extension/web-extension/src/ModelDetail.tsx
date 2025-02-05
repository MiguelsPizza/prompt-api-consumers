// ModelDetail.tsx
import { CachedModel } from "@/background/lib/modelUtils";
import { Alert, AlertDescription, AlertTitle } from "@local-first-web-ai-monorepo/react-ui/components/alert";
import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { trpc } from "../entrypoints/popup/trpcClient";

/**
 * Extracts the model ID from a manifest URL.
 *
 * @param manifestUrl - The full URL of the manifest.
 * @returns The extracted model ID.
 */
function extractModelId(manifestUrl: string): string {
  try {
    const url = new URL(manifestUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && segments[segments.length - 1] === "ndarray-cache.json") {
      return segments[segments.length - 2];
    }
  } catch (err) {
    console.error("Failed to extract model id from manifestUrl", manifestUrl, err);
  }
  return manifestUrl;
}

/**
 * ModelDetail: Displays detailed information for a single cached model.
 */
export default function ModelDetail() {
  // Read the modelId from the route parameters.
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const [modelDetail, setModelDetail] = useState<CachedModel | null>(null);

  // Fetch the full list of cached models.
  const { data: models, isLoading } = trpc.models.listModels.useQuery();

  useEffect(() => {
    if (models && modelId) {

      const found = models.find((m) => extractModelId(m.manifestUrl) === modelId);
      setModelDetail(found || null);
    }
  }, [models, modelId]);

  // Mutation to delete the model.
  const deleteModelMutation = trpc.models.deleteModel.useMutation();

  /**
   * Handles deletion of the current model.
   */
  const handleDeleteModel = async () => {
    if (modelId && confirm(`Are you sure you want to delete model "${modelId}" from the cache?`)) {
      try {
        await deleteModelMutation.mutateAsync({ modelId });
        navigate("/models");
      } catch (err) {
        console.error("Error deleting model:", err);
      }
    }
  };

  if (isLoading) {
    return <div>Loading model details...</div>;
  }

  if (!modelDetail) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Model Not Found</AlertTitle>
        <AlertDescription>No cached model found with ID: {modelId}</AlertDescription>
        <Link to="/models">
          <Button variant="outline">Back to Models</Button>
        </Link>
      </Alert>
    );
  }

  return (
    <div className="p-4 space-y-4">

    </div>
  );
}
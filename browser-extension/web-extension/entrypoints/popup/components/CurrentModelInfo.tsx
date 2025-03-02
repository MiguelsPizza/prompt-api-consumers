import { ZSupportedLLMModel } from '@/entrypoints/background/lib/supportedModels';
import { Button } from '@local-first-web-ai-monorepo/react-ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@local-first-web-ai-monorepo/react-ui/components/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@local-first-web-ai-monorepo/react-ui/components/select';
import { useState } from 'react';
import { useCurrentModel } from '../contexts/CurrentModelContext';
import { trpc } from '../trpcClient';

/**
 * Displays the current model information and provides a ShadCN-based dropdown
 * to change the current model.
 */
export function CurrentModelInfo() {
  // Use the context to get the current model
  const { currentModel } = useCurrentModel();
  const [newModelId, setNewModelId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { data: models } = trpc.models.listModels.useQuery(undefined, {
    initialData: [], // Use loader data as initial data
    refetchInterval: 500,
  });

  const setCurrentModelMutation = trpc.models.setCurrentModel.useMutation();

  const handleSetModel = async () => {
    if (!newModelId.trim()) {
      setError('Model ID cannot be empty');
      return;
    }
    try {
      const parsedModelId = ZSupportedLLMModel.parse(newModelId.trim());
      await setCurrentModelMutation.mutateAsync(parsedModelId);
      setNewModelId('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to set current model');
      console.error('Error setting current model:', err);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Current Model Info</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          {currentModel ? (
            <>
              Current Model: <strong>{currentModel}</strong>
            </>
          ) : (
            <>No model is currently selected.</>
          )}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Select value={newModelId} onValueChange={setNewModelId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map(({ model_id }) => (
                <SelectItem key={model_id} value={model_id}>
                  {model_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSetModel}>Set as Current</Button>
        </div>
        {error && <p className="mt-2 text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
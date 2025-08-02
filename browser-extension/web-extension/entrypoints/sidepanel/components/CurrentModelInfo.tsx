import { SupportedLLMModel, ZSupportedLLMModel } from '@/entrypoints/background/lib/supportedModels';
import { Button } from '@local-first-web-ai-monorepo/react-ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@local-first-web-ai-monorepo/react-ui/components/card';
import { Progress } from '@local-first-web-ai-monorepo/react-ui/components/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@local-first-web-ai-monorepo/react-ui/components/select';
import { Slider } from '@local-first-web-ai-monorepo/react-ui/components/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@local-first-web-ai-monorepo/react-ui/components/tabs';
import { Download, HardDrive, Settings, Zap } from 'lucide-react';
import { useState } from 'react';
import { useCurrentModel } from '../contexts/CurrentModelContext';
import { useModels } from '../hooks/useModels';
import { trpc } from '../trpcClient';

/**
 * Displays comprehensive information about the current model and provides controls
 * for model selection and configuration.
 */
export function CurrentModelInfo() {
  const { currentModel } = useCurrentModel();
  const [newModelId, setNewModelId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topK, setTopK] = useState<number>(40);

  const { models, isLoading } = useModels();
  const setCurrentModelMutation = trpc.models.setCurrentModel.useMutation();
  const downloadModelMutation = trpc.models.downloadModel.useMutation();

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

  const handleDownloadModel = async (modelId: SupportedLLMModel | null) => {
    if (modelId === null) return
    try {
      const [success, errorMsg] = await downloadModelMutation.mutateAsync({ modelId });
      if (!success && errorMsg) {
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download model');
      console.error('Error downloading model:', err);
    }
  };

  const currentModelDetails = currentModel ? models[currentModel] : null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Model Configuration</span>
          {currentModel && (
            <div className={`text-xs px-2 py-1 rounded-full ${currentModelDetails ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {currentModelDetails ? "Active" : "Not Loaded"}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="selection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="selection" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Selection
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="space-y-4">
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                {currentModel ? (
                  <>Currently using <strong>{currentModel}</strong></>
                ) : (
                  'No model selected'
                )}
              </p>

              <div className="flex items-center gap-2">
                <Select value={newModelId} onValueChange={setNewModelId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(models).map(({ model_id }) => (
                      <SelectItem key={model_id} value={model_id}>
                        {model_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSetModel}>Set as Current</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Temperature</label>
                <p className="text-sm text-muted-foreground">
                  Controls randomness in responses. Higher values make output more creative.
                </p>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[temperature]}
                    onValueChange={([value]) => setTemperature(value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">{temperature}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Top K</label>
                <p className="text-sm text-muted-foreground">
                  Limits token consideration during generation. Lower values increase focus.
                </p>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[topK]}
                    onValueChange={([value]) => setTopK(value)}
                    min={1}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">{topK}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            {currentModelDetails && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Model Size</h4>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {/* Add actual size calculations here */}
                    Approximately 2.7GB downloaded
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadModel(currentModel)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Model
                  </Button>
                  {/* Add cache clear button here if needed */}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-2 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
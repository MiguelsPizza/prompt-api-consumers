import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';

interface CreateConversationCardProps {
  onNewConversation: () => void;
}

export function CreateConversationCard({ onNewConversation }: CreateConversationCardProps) {
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(10);
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleCreateConversation = () => {
    // You'll need to modify your handleNewConversation function to accept these parameters
    onNewConversation();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>Create a New Conversation</CardTitle>
          <CardDescription>Configure your chat settings and start a new conversation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Temperature: {temperature}
            </label>
            <Slider
              value={[temperature]}
              max={1}
              min={0}
              step={0.1}
              onValueChange={(value) => setTemperature(value[0])}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Top K: {topK}
            </label>
            <Slider
              value={[topK]}
              max={40}
              min={1}
              step={1}
              onValueChange={(value) => setTopK(value[0])}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">System Prompt:</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter a system prompt to guide the AI's behavior..."
            />
          </div>

          <Button onClick={handleCreateConversation} className="w-full flex gap-2 justify-center">
            <PlusCircle className="h-5 w-5" />
            Create New Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
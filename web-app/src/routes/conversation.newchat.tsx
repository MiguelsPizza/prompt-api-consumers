import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider';
import { useConversation } from '@/utils/Contexts';

export const Route = createFileRoute('/conversation/newchat')({
  component: NewConversation,
  beforeLoad: () => ({
    meta: {
      title: 'New Conversation',
      description: 'Start a new AI conversation with custom settings'
    }
  }),
})

function NewConversation() {
  const { handleNewConversation, } = useConversation();
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(10);
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleCreateConversation = async () => {
    const id = await handleNewConversation(systemPrompt, topK, temperature);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-[600px] bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-foreground">Create a New Conversation</CardTitle>
          <CardDescription className="text-muted-foreground">Configure your chat settings and start a new conversation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Temperature: {temperature}
            </label>
            <Slider
              value={[temperature]}
              max={1}
              min={0}
              step={0.1}
              onValueChange={(value) => setTemperature(value[0])}
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Top K: {topK}
            </label>
            <Slider
              value={[topK]}
              max={40}
              min={1}
              step={1}
              onValueChange={(value) => setTopK(value[0])}
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">System Prompt:</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter a system prompt to guide the AI's behavior..."
            />
          </div>

          <Button onClick={handleCreateConversation} className="w-full flex gap-2 justify-center bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="h-5 w-5" />
            Create New Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
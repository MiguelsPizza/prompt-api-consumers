import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useConversation } from '@/utils/Contexts';
import { createFileRoute } from '@tanstack/react-router';
import { HelpCircle, PlusCircle } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/conversation/newchat')({
  component: NewConversation,
  beforeLoad: () => ({
    meta: {
      title: 'New Conversation',
      description: 'Start a new AI conversation with custom settings',
    },
  }),
});

function NewConversation() {
  const { handleNewConversation } = useConversation();
  const [temperature, setTemperature] = useState(0.7);
  const [top_k, settop_k] = useState(10);
  const [system_prompt, setsystem_prompt] = useState('');

  const handleCreateConversation = async () => {
    const id = await handleNewConversation(system_prompt, top_k, temperature);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-[600px] bg-card text-card-foreground gradient-violet">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            Create a New Conversation
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure your chat settings and start a new conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex justify-between items-center">
              <span className="flex items-center gap-2">
                Temperature
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-violet-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>
                        Controls randomness in responses. Higher values (closer
                        to 1) make the output more creative but less focused,
                        while lower values make it more deterministic and
                        focused.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span className="text-violet-400">{temperature}</span>
            </label>
            <Slider
              value={[temperature]}
              max={1}
              min={0}
              step={0.1}
              onValueChange={(value) => {
                setTemperature(value[0]);
              }}
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex justify-between items-center">
              <span className="flex items-center gap-2">
                Top K
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-violet-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>
                        Limits the number of tokens the model considers for each
                        prediction. Lower values make responses more focused but
                        potentially less nuanced, while higher values allow for
                        more diverse vocabulary.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span className="text-violet-400">{top_k}</span>
            </label>
            <Slider
              value={[top_k]}
              max={40}
              min={1}
              step={1}
              onValueChange={(value) => {
                settop_k(value[0]);
              }}
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              System Prompt
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-violet-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>
                      Initial instructions that define the AI's behavior and
                      role. This sets the context and guidelines for how the AI
                      should respond throughout the conversation.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-violet-600/20 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              value={system_prompt}
              onChange={(e) => {
                setsystem_prompt(e.target.value);
              }}
              placeholder="Enter a system prompt to guide the AI's behavior..."
            />
          </div>

          <Button
            onClick={handleCreateConversation}
            className="w-full flex gap-2 justify-center bg-violet-600 hover:bg-violet-700 text-white transition-colors duration-200"
          >
            <PlusCircle className="h-5 w-5" />
            Create New Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

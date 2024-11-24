import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, } from "@/components/ui/sheet"
import { Slider } from '@/components/ui/slider';
import { Settings, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { db } from '@/powersync/AppSchema';
import { ChatHeaderProps } from '../../types/chat';
import React from 'react';
import { useToast } from '@/hooks/use-toast';

export const ChatHeader = ({
  sidebarCollapsed,
  onToggleSidebar,
  currentConversation,
  currentConversationId,
  onDeleteConversation,
}: ChatHeaderProps) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [systemPrompt, setSystemPrompt] = React.useState(currentConversation?.system_prompt ?? '');

  const handleTemperatureChange = async (value: number[]) => {
    if (!currentConversationId) return;

    try {
      await db.conversation.update(currentConversationId, {
        temperature: value[0],
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update temperature.",
      });
    }
  };

  const handleTopKChange = async (value: number[]) => {
    if (!currentConversationId) return;

    try {
      await db.conversation.update(currentConversationId, {
        top_k: value[0],
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update top K value.",
      });
    }
  };

  const handleSystemPromptChange = async () => {
    if (!currentConversationId) return;

    try {
      await db.conversation.update(currentConversationId, {
        system_prompt: systemPrompt,
      });
      toast({
        title: "System Prompt Updated",
        description: "The system prompt has been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update system prompt.",
      });
    }
  };

  return (
    <header className="bg-white border-b p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSidebar}
          className="mr-2"
        >
          {sidebarCollapsed ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
        </Button>
        <h1 className="text-xl font-bold">{currentConversation?.conversation_summary || "Chat"}</h1>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Chat Settings</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Temperature: {currentConversation?.temperature}
              </label>
              <Slider
                defaultValue={[currentConversation?.temperature ?? 0.7]}
                max={1}
                min={0}
                step={0.1}
                onValueChange={handleTemperatureChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Top K: {currentConversation?.top_k}
              </label>
              <Slider
                defaultValue={[currentConversation?.top_k ?? 10]}
                max={40}
                min={1}
                step={1}
                onValueChange={handleTopKChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">System Prompt:</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <Button
                className="w-full mt-2"
                onClick={handleSystemPromptChange}
              >
                Update System Prompt
              </Button>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => {
                if (currentConversationId) {
                  onDeleteConversation(currentConversationId, () => setOpen(false));
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Conversation
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};
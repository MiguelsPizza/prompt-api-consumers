import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Settings, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { db } from '../../local-db/db';
import { ChatHeaderProps } from '../../types/chat';

export const ChatHeader = ({
  sidebarCollapsed,
  onToggleSidebar,
  currentConversation,
  currentConversationId,
  onDeleteConversation
}: ChatHeaderProps) => {
  const handleTemperatureChange = async (value: number[]) => {
    if (!currentConversationId) return;

    await db.conversation.update(currentConversationId, {
      temperature: value[0],
    });
  };

  const handleTopKChange = async (value: number[]) => {
    if (!currentConversationId) return;

    await db.conversation.update(currentConversationId, {
      top_k: value[0],
    });
  };

  const handleSystemPromptChange = async (value: string) => {
    if (!currentConversationId) return;

    await db.conversation.update(currentConversationId, {
      system_prompt: value,
    });
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
          {sidebarCollapsed ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        </Button>
        <h1 className="text-xl font-bold">Chat</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[300px]">
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="p-2">
            <label className="text-sm font-medium">Temperature: {currentConversation?.temperature}</label>
            <Slider
              defaultValue={[currentConversation?.temperature ?? 0.7]}
              max={1}
              min={0}
              step={0.1}
              onValueChange={handleTemperatureChange}
              className="my-2"
            />
          </div>

          <div className="p-2">
            <label className="text-sm font-medium">Top K: {currentConversation?.top_k}</label>
            <Slider
              defaultValue={[currentConversation?.top_k ?? 10]}
              max={40}
              min={1}
              step={1}
              onValueChange={handleTopKChange}
              className="my-2"
            />
          </div>

          <div className="p-2">
            <label className="text-sm font-medium">System Prompt:</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md text-sm"
              rows={3}
              defaultValue={currentConversation?.system_prompt ?? ''}
              onChange={(e) => handleSystemPromptChange(e.target.value)}
            />
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 cursor-pointer"
            onClick={() => currentConversationId && onDeleteConversation(currentConversationId)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Conversation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
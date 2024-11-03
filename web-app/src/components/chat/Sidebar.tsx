import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';
import { SidebarProps } from '../../types/chat';

export const Sidebar = ({
  conversations,
  currentConversationId,
  sidebarCollapsed,
  onNewChat,
  onDeleteConversation,
  onSelectConversation,
}: SidebarProps) => {
  if (sidebarCollapsed) return null;

  return (
    <>
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full mb-4 text-gray-900 hover:text-green-500"
          onClick={onNewChat}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> New chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {conversations?.map((conversation) => (
            <div key={conversation.id} className="flex items-center mb-2 group">
              <Button
                variant="ghost"
                className="flex-1 justify-start bg-gray-800 text-white hover:bg-gray-700 hover:text-green-500 transition-colors duration-300"
                onClick={() => onSelectConversation(conversation.id)}
              >
                {conversation.name}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-red-900 hover:text-red-500"
                onClick={() => onDeleteConversation(conversation.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );
};

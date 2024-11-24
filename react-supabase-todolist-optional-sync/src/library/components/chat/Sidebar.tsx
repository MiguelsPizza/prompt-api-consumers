import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';
import { SidebarProps } from '../../types/chat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { db } from '@/local-db/db';

export const Sidebar = ({
  conversations,
  currentConversationId,
  sidebarCollapsed,
  setSidebarCollapsed,
  handleNewConversation,
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
          onClick={() => handleNewConversation()}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> New chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {conversations?.map((conversation) => (
            <TooltipProvider>

              <div
                key={conversation.id}
                className={`
                relative group rounded-lg overflow-hidden
                ${conversation.id === currentConversationId ? 'bg-gray-700' : 'bg-gray-800'}
                hover:bg-gray-700 transition-all duration-200 ease-in-out
                transform hover:scale-[1.02] hover:shadow-lg
                `}
              >
                <Tooltip delayDuration={200} >
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`
                      w-full justify-start pr-12 py-6
                      text-white hover:text-green-500
                      transition-colors duration-300
                      truncate
                      ${conversation.id === currentConversationId ? 'text-green-400' : ''}
                      `}
                      onClick={() => onSelectConversation(conversation.id)}
                    >
                      {(conversation.conversation_summary ?? conversation.name).length > 20
                        ? `${(conversation.conversation_summary ?? conversation.name).slice(0, 20)}...`
                        : (conversation.conversation_summary ?? conversation.name)
                      }
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='right'>
                    <p>{conversation.conversation_summary ?? conversation.name}</p>
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2
                opacity-0 group-hover:opacity-100
                text-gray-400 hover:text-red-500 hover:bg-red-900/20
                transition-all duration-200"
                  onClick={async () => onDeleteConversation(conversation.id, await db.conversation.count() === 1 ? () => setSidebarCollapsed(true) : undefined)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TooltipProvider>
          ))}
        </div>
      </ScrollArea>
    </>
  );
};

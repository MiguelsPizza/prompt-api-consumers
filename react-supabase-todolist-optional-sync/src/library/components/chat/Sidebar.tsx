import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogIn, PlusCircle, Trash2, Upload } from 'lucide-react';
import { SidebarProps } from '@/types/chat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { db  } from '@/powersync/AppSchema';
import { Link } from '@tanstack/react-router';
import { EnterIcon } from '@radix-ui/react-icons';

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
          className="w-full mb-4 flex items-center justify-center text-gray-900 hover:text-green-500 hover:bg-green-50 transition-colors duration-200"
          onClick={() => handleNewConversation()}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </div>
      <div className="p-4">
        <Link
          to='/auth/login'
          className="w-full mb-4 flex items-center justify-center px-4 py-2 rounded-md text-gray-900 hover:text-green-500 hover:bg-green-50 border border-gray-200 transition-colors duration-200"
        >
          <LogIn className="mr-2 h-4 w-4" /> Sign In
        </Link>
      </div>
      <div className="p-4">
        <Link
          to='/auth/register'
          className="w-full mb-4 flex items-center justify-center px-4 py-2 rounded-md text-gray-900 hover:text-green-500 hover:bg-green-50 border border-gray-200 transition-colors duration-200"
        >
          <Upload className="mr-2 h-4 w-4" /> Create Account
        </Link>
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
                      {(() => {
                        const displayText = conversation?.conversation_summary || conversation?.name || '';
                        return displayText.length > 20
                          ? `${displayText.slice(0, 20)}...`
                          : displayText;
                      })()}
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
                  onClick={async () => {
                    const { count } = await db.selectFrom('conversations')
                      .select(({ fn }) => [fn.count<number>('id').as('count')])
                      .executeTakeFirstOrThrow();
                    onDeleteConversation(conversation.id, count === 1 ? () => setSidebarCollapsed(true) : undefined);
                  }}
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

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookUser, LogIn, PlusCircle, Trash2, Upload } from 'lucide-react';
import { SidebarProps } from '@/types/chat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { db } from '@/powersync/AppSchema';
import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { useQuery } from '@powersync/react';
import { useConversation, useSupabase } from '@/utils/Contexts';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Cloud, CloudOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PowerSyncDatabase, UpdateType } from '@powersync/web';
import { Card } from '@mui/material';
import { CardContent } from '../ui/card';

export const Sidebar = ({
  setSidebarCollapsed,
}: SidebarProps) => {
  const { toast } = useToast()
  const { useSearch, useParams } = getRouteApi('/conversation')
  // @ts-expect-error Not sure how to do this properly with Tanstack router
  const { sidebar, authType } = useSearch()
  // @ts-expect-error Not sure how to do this properly with Tanstack router
  const { id: currentConversationId } = useParams()
  const { data: conversations } = useQuery(db.selectFrom('conversations').selectAll().orderBy('created_at', 'desc'))
  const { handleNewConversation, handleDeleteConversation, navigateToConversation } = useConversation()
  const router = useRouter()
  const currentPath = router.state.location.pathname
  console.log({ currentPath })
  const supabase = useSupabase()
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'synced'>('offline');
  const powerSync = (window as any)._powersync as PowerSyncDatabase

  useEffect(() => {
    const updateStatus = () => {
      if (!powerSync.connected) {
        setSyncStatus('offline');
        return;
      }

      // Check if there are pending uploads
      powerSync.getNextCrudTransaction().then(transaction => {
        setSyncStatus(transaction ? 'syncing' : 'synced');
      });
    };

    // Initial status check
    updateStatus();

    // Set up listeners for connection changes and crud operations
    const unsubscribe = powerSync.registerListener({
      statusChanged: updateStatus,
      uploadComplete: updateStatus
    });

    return () => unsubscribe?.();
  }, [powerSync]);

  if (sidebar === 'collapsed') return null;

  return (
    <>
      <Button
        variant="ghost"
        className=" m-4 mb-0 gradient-violet shadow-lg rounded-lg flex items-center gap-2 text-sm p-4"
        disabled
      >
        {syncStatus === 'offline' && (
          <>
            <CloudOff className="h-5 w-5 text-violet-500" />
            <span className="text-violet-300 font-medium">Offline</span>
          </>
        )}
        {syncStatus === 'syncing' && (
          <>
            <Cloud className="h-5 w-5 animate-pulse text-violet-500" />
            <span className="text-violet-300 font-medium">Syncing...</span>
          </>
        )}
        {syncStatus === 'synced' && (
          <>
            <CheckCircle2 className="h-5 w-5 text-violet-500" />
            <span className="text-violet-300 font-medium">All changes synced</span>
          </>
        )}
      </Button>

      <div className="p-4 flex justify-between">
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`text-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200 h-10 w-10 ${!currentPath.includes('auth') ? 'gradient-violet' : ''}`}
                onClick={() => handleNewConversation()}
              >
                <PlusCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200 h-10 w-10"
                onClick={() => toast({
                  title: 'Coming Soon!',
                  description: 'you will be able to share and collaborate on chats with others'
                })}
              >
                <BookUser className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {supabase.currentSession ? (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Link to='/conversation/profile'>
                  <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src={supabase.currentSession.user.user_metadata?.avatar_url} />
                    <AvatarFallback>{supabase.currentSession.user.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Profile</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Link to='/conversation/auth' search={{ sidebar: 'open', 'authType': 'login', 'conversationOptions': 'collapsed' }}>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`text-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200 h-10 w-10 ${authType === 'login' ? 'gradient-violet' : ''}`}
                    >
                      <LogIn className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Sign In</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Link to='/conversation/auth' search={{ sidebar: 'open', 'authType': 'signup', 'conversationOptions': 'collapsed' }}>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`text-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200 h-10 w-10 ${authType === 'signup' ? 'gradient-violet' : ''}`}
                    >
                      <Upload className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Create Account</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {conversations?.map((conversation) => (
            <TooltipProvider key={`tooltip-${conversation.id}`}>
              <div
                className={`
                relative group rounded-lg overflow-hidden
                ${conversation.id === currentConversationId ? 'gradient-violet' : 'bg-card'}
                hover:gradient-violet transition-all duration-200 ease-in-out
                transform hover:scale-[1.02] hover:shadow-lg
                `}
              >
                <Tooltip delayDuration={200} >
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`
                      w-full justify-start pr-12 py-6
                      text-foreground hover:text-primary
                      transition-colors duration-300
                      truncate
                      ${conversation.id === currentConversationId ? 'text-primary' : ''}
                      `}
                      onClick={() => navigateToConversation(conversation.id)}
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
                text-muted-foreground hover:text-destructive hover:bg-destructive/10
                transition-all duration-200"
                  onClick={async () => {
                    const { count } = await db.selectFrom('conversations')
                      .select(({ fn }) => [fn.count<number>('id').as('count')])
                      .executeTakeFirstOrThrow();
                    handleDeleteConversation(conversation.id, count === 1 ? () => setSidebarCollapsed(true) : undefined);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TooltipProvider>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 flex justify-center">
        <img
          src="/pwa-512x512.png"
          alt="Logo"
          className="w-30 h-30"
        />
      </div>
    </>
  );
};

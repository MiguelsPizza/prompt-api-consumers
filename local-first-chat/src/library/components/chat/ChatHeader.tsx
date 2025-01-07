import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Settings, ArrowRight, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { useDrizzlePGlite } from '@/dataLayer';
import {
  conversations,
  conversation_messages,
} from 'local-first-chat-api/schema';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from '@tanstack/react-router';
import { getRouteApi } from '@tanstack/react-router';
import { useConversation } from '@/utils/Contexts';
import { useDrizzleLiveIncremental } from '@/dataLayer';
import { eq } from 'drizzle-orm';

export const ChatHeader = () => {
  const { toast } = useToast();
  const db = useDrizzlePGlite();

  const { handleDeleteConversation } = useConversation();
  const { useSearch, useParams } = getRouteApi('/conversation/$id');
  const [system_prompt, setsystem_prompt] = useState('');
  const { sidebar, conversationOptions } = useSearch();
  const { id: currentConversationId } = useParams();

  useEffect(() => {
    db.select({ system_prompt: conversations.system_prompt })
      .from(conversations)
      .where(eq(conversations.id, currentConversationId))
      .limit(1)
      .then((a) => {
        setsystem_prompt(a[0].system_prompt ?? '');
      });
  }, []);

  const { data: currentConversation } = useDrizzleLiveIncremental('id', (db) =>
    db.query.conversations.findFirst({
      where: ({ id }, { eq }) => eq(id, currentConversationId),
    }),
  );

  const navigate = useNavigate({ from: '/conversation/$id' });

  const sidebarCollapsed = sidebar === 'collapsed';
  const conversationOptionsCollapsed = conversationOptions === 'collapsed';

  const handleToggleSidebar = () => {
    navigate({
      search: (curr) => ({
        conversationOptions: conversationOptions,
        sidebar: sidebarCollapsed ? 'open' : 'collapsed',
      }),
    });
  };

  const handleTemperatureChange = async (value: number[]) => {
    if (!currentConversationId) return;

    try {
      await db
        .update(conversations)
        .set({ temperature: value[0] })
        .where(eq(conversations.id, currentConversationId.toString()));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update temperature.',
      });
    }
  };

  const handletop_kChange = async (value: number[]) => {
    if (!currentConversationId) return;

    try {
      await db
        .update(conversations)
        .set({ top_k: value[0] })
        .where(eq(conversations.id, currentConversationId.toString()));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update top K value.',
      });
    }
  };

  const handlesystem_promptChange = async () => {
    if (!currentConversationId) return;

    try {
      await db
        .update(conversations)
        .set({ system_prompt: system_prompt })
        .where(eq(conversations.id, currentConversationId));
      toast({
        title: 'System Prompt Updated',
        description: 'The system prompt has been successfully updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update system prompt.',
      });
    }
  };

  return (
    <header className="bg-background border-b p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggleSidebar}
          className="mr-2"
        >
          {sidebarCollapsed ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
        </Button>
        <h1 className="text-xl font-bold text-foreground">
          {currentConversation?.conversation_summary || 'Chat'}
        </h1>
      </div>

      <Sheet
        open={!conversationOptionsCollapsed}
        onOpenChange={() =>
          navigate({
            search: (curr) => ({
              ...curr,
              conversationOptions:
                curr.conversationOptions === 'collapsed' ? 'open' : 'collapsed',
            }),
          })
        }
      >
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
              <label className="text-sm font-medium text-foreground">
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
              <label className="text-sm font-medium text-foreground">
                Top K: {currentConversation?.top_k}
              </label>
              <Slider
                defaultValue={[currentConversation?.top_k ?? 10]}
                max={40}
                min={1}
                step={1}
                onValueChange={handletop_kChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                System Prompt:
              </label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={system_prompt}
                onChange={(e) => {
                  setsystem_prompt(e.target.value);
                }}
              />
              <Button
                className="w-full mt-2"
                onClick={handlesystem_promptChange}
              >
                Update System Prompt
              </Button>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => {
                if (currentConversationId) {
                  handleDeleteConversation(currentConversationId);
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

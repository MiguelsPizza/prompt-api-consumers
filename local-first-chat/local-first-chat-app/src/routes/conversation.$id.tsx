import { createFileRoute } from '@tanstack/react-router';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInterfaceSchema } from '@/utils/paramValidators';
import { useDrizzlePGlite } from '@/dataLayer';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useConversationSummary } from '@/hooks/useConversationSummary';
import { useQuery } from '@tanstack/react-query';
import { conversation_messages } from 'local-first-chat-api/schema';
import { eq } from 'drizzle-orm';
import { queryClient } from '../main';
import React from 'react';

export const Route = createFileRoute('/conversation/$id')({
  component: ConversationView,
  validateSearch: ChatInterfaceSchema,
  beforeLoad: ({ params }) => ({
    meta: {
      title: `Chat #${params.id}`,
      description: 'Chat conversation',
    },
  }),
  preload: true,
  staleTime: 30000, // Data stays fresh for 30 seconds
  gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes

  loader: async ({ params, context: { db } }) => {
    const conversation = await db!.query.conversations.findFirst({
      where: (conversations, { eq }) => eq(conversations.id, params.id),
      with: {
        conversation_messages: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    await queryClient.prefetchQuery({
      queryKey: ['conversation', conversation.id, 'messages'],
      queryFn: async () => conversation.conversation_messages,
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    });

    return conversation;
  },
  pendingComponent: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    </div>
  ),
  errorComponent: ({ error }: { error: any }) => (
    <div className="flex-1 flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : 'Failed to load conversation'}
        </AlertDescription>
      </Alert>
    </div>
  ),
});

function ConversationView() {
  const { id } = Route.useParams();

  // Wrap the content in a memo to prevent unnecessary re-renders
  const MemoizedContent = React.useMemo(
    () => (
      <>
        <ChatHeader />
        <ChatMessages />
      </>
    ),
    [id], // Only re-render when conversation ID changes
  );

  return MemoizedContent;
}

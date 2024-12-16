import { createFileRoute } from '@tanstack/react-router';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInterfaceSchema } from '@/utils/paramValidators';
import { db } from '@/dataLayer/db';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useConversationSummary } from '@/hooks/useConversationSummary';

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
  // staleTime: 10000,
  // preloadGcTime: 10000,
  loader: async ({ params }) => {
    console.log('prefectching');
    const conversation = await db.query.conversations.findFirst({
      where: (conversations, { eq }) => eq(conversations.id, params.id),
      with: {
        conversation_messages: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }
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
        <AlertDescription>{error instanceof Error ? error.message : 'Failed to load conversation'}</AlertDescription>
      </Alert>
    </div>
  ),
});

function ConversationView() {
  const { id } = Route.useParams();

  useConversationSummary(id);

  return (
    <>
      <ChatHeader />
      <ChatMessages />
    </>
  );
}

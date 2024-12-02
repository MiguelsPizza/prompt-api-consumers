import { createFileRoute } from '@tanstack/react-router';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInterfaceSchema } from '@/utils/paramValidators';
import { db } from '@/powersync/AppSchema';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useConversationSummary } from '@/hooks/useConversationSummary';
import { AssistantRuntimeProvider } from "@assistant-ui/react";


export const Route = createFileRoute('/conversation/$id')({
  component: ConversationView,
  validateSearch: ChatInterfaceSchema,
  beforeLoad: ({ params }) => ({
    meta: {
      title: `Chat #${params.id}`,
      description: 'Chat conversation'
    }
  }),
  loader: async ({ params }) => {
    const conversation = await db.selectFrom('conversations').selectAll().where('conversations.id', '=', params.id).executeTakeFirst();
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
  errorComponent: ({ error }) => (
    <div className="flex-1 flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load conversation'}
        </AlertDescription>
      </Alert>
    </div>
  )
});

function ConversationView() {
  const { id } = Route.useParams()

  useConversationSummary(id);


  return (
    <>
      <ChatHeader />
      <ChatMessages />
    </>
  );
}
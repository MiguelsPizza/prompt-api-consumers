import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { useConversationSummary } from '@/hooks/useConversationSummary';
import { Loader2 } from 'lucide-react';
import { ChatInterfaceSearchSchema } from '@/utils/paramValidators';
import { useConversation } from '@/utils/Contexts';

export const Route = createFileRoute('/conversation/$id')({
  component: ConversationView,
  validateSearch: ChatInterfaceSearchSchema,
  beforeLoad: ({ params }) => ({
    meta: {
      title: `Chat #${params.id}`,
      description: 'Chat conversation'
    }
  }),
})

function ConversationView() {
  const { currentConversationId, currentConversation } = useConversation()

  useConversationSummary(currentConversationId);

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-1000">
      <ChatHeader />
      <ChatMessages />
    </div>
  );
}
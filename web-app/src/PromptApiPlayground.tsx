import { useLayoutEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './local-db/db';
import { ChatMessages } from './components/chat/ChatMessages';
import { Sidebar } from './components/chat/Sidebar';
import { ChatHeader } from './components/chat/ChatHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Button } from './components/ui/button';

export default function ChatInterface() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentConversation = useLiveQuery(
    async () => {
      if (currentConversationId) {
        return await db.conversation.get(currentConversationId);
      }
    },
    [currentConversationId]
  );

  const conversations = useLiveQuery(() => db.conversation.toArray());

  useLayoutEffect(() => {
    if (conversations && !currentConversationId) {
      const id = conversations.at(-1)?.id
      setCurrentConversationId(id ?? null)
    }

  }, [conversations?.length])

  const handleDeleteConversation = async (id: number) => {
    try {
      await db.conversationMessage
        .where('conversation')
        .equals(id)
        .delete();

      await db.conversation.delete(id);

      const newCurrentConversation = await db.conversation.toArray();
      if (newCurrentConversation.length > 0) {
        setCurrentConversationId(newCurrentConversation.at(-1)!.id);
      }else{
        setCurrentConversationId(null)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const now = new Date();
      const id = await db.conversation.add({
        name: 'New conversation',
        conversation_summary: null,
        system_prompt: null,
        created_at: now,
        updated_at: now,
        top_k: 10,
        temperature: 0.7,
      });
      setCurrentConversationId(id);
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  const CreateConversationCard = () => (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Create a New Conversation</CardTitle>
          <CardDescription>
            Start a new chat by clicking the button below
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={handleNewConversation}
            className="flex gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            New Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-64'
          }`}
      >
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          sidebarCollapsed={sidebarCollapsed}
          onNewChat={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onSelectConversation={setCurrentConversationId}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentConversationId ? (
          <>
            <ChatHeader
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              currentConversation={currentConversation}
              currentConversationId={currentConversationId}
              onDeleteConversation={handleDeleteConversation}
            />
            <ChatMessages currentConversation={currentConversation} />
          </>
        ) : (
          <CreateConversationCard />
        )}
      </div>
    </div>
  );
}
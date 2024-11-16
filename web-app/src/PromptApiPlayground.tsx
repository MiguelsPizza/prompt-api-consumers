import { useState } from 'react';
import { ChatMessages } from './components/chat/ChatMessages';
import { Sidebar } from './components/chat/Sidebar';
import { ChatHeader } from './components/chat/ChatHeader';
import { AIStatusCard } from './components/chat/AIStatusCard';
import { useConversationManager } from './hooks/useConversationManager';
import { useConversationSummary } from './hooks/useConversationSummary';
import { CreateConversationCard } from './components/chat/CreateConversationCard';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './local-db/db';

export default function ChatInterface() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const noConversations = (useLiveQuery(async () => db.conversation.count()) ?? 0) === 0

  const {
    currentConversationId,
    setCurrentConversationId,
    currentConversation,
    conversations,
    handleDeleteConversation,
    handleNewConversation,
  } = useConversationManager();

  useConversationSummary(currentConversationId);

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${(sidebarCollapsed || noConversations) ? 'w-0' : 'w-64'}`}
      >
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          sidebarCollapsed={(sidebarCollapsed || noConversations)}
          setSidebarCollapsed={setSidebarCollapsed}
          handleNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onSelectConversation={setCurrentConversationId}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentConversationId && currentConversation ? (
          <div
            key={currentConversationId}
            className="flex-1 flex flex-col animate-in fade-in duration-1000"
          >
            <ChatHeader
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              currentConversation={currentConversation}
              currentConversationId={currentConversationId}
              onDeleteConversation={handleDeleteConversation}
            />
            <ChatMessages currentConversation={currentConversation} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <CreateConversationCard handleNewConversation={handleNewConversation} />
          </div>
        )}
        <div className="animate-in fade-in duration-1000">
          <AIStatusCard />
        </div>
      </div>
    </div>
  );
}
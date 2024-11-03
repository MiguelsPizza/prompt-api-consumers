import { useState } from 'react';
import { useAICapabilities } from '../../use-prompt-api/src/hooks/useAICapabilities';
import { ChatMessages } from './components/chat/ChatMessages';
import { Sidebar } from './components/chat/Sidebar';
import { ChatHeader } from './components/chat/ChatHeader';
import { AIStatusCard } from './components/chat/AIStatusCard';
import { useConversationManager } from './hooks/useConversationManager';
import { useConversationSummary } from './hooks/useConversationSummary';

export default function ChatInterface() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    available,
    error,
    downloadProgress,
    isDownloading,
    startDownload,
    cancelDownload,
  } = useAICapabilities();

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
        className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-0' : 'w-64'
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
        {currentConversationId && available === 'readily' ? (
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
          <div className="animate-in fade-in duration-1000">
            <AIStatusCard
              error={error}
              available={available}
              isDownloading={isDownloading}
              downloadProgress={downloadProgress}
              startDownload={startDownload}
              cancelDownload={cancelDownload}
              onNewConversation={handleNewConversation}
            />
          </div>
        )}
      </div>
    </div>
  );
}

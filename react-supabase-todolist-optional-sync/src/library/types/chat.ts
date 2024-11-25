import { HandlerNewConversationType } from '@/hooks/useConversationManager';
import { ConversationType } from '@/powersync/AppSchema'
import { Dispatch, SetStateAction } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: number;
}

export interface ChatMessagesProps {
  currentConversation: ConversationType;
}

export interface SidebarProps {
  conversations?: ConversationType[];
  currentConversationId: string | null;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: Dispatch<SetStateAction<boolean>>
  handleNewConversation: HandlerNewConversationType
  onDeleteConversation: (id: string,sideEffect?: () => any) => void;
  onSelectConversation: (id: string) => void;
}

export interface ChatHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  currentConversation?: ConversationType;
  currentConversationId: string | null;
  onDeleteConversation: (id: string,sideEffect?: () => any) => void;
}

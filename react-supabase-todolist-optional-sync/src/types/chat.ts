import { HandlerNewConversationType } from '@/hooks/useConversationManager';
import { Conversation } from '@/local-db/db';
import { Dispatch, SetStateAction } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: number;
}

export interface ChatMessagesProps {
  currentConversation: Conversation;
}

export interface SidebarProps {
  conversations?: Conversation[];
  currentConversationId: number | null;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: Dispatch<SetStateAction<boolean>>
  handleNewConversation: HandlerNewConversationType
  onDeleteConversation: (id: number,sideEffect?: () => any) => void;
  onSelectConversation: (id: number) => void;
}

export interface ChatHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  currentConversation?: Conversation;
  currentConversationId: number | null;
  onDeleteConversation: (id: number,sideEffect?: () => any) => void;
}

import { Conversation } from "@/local-db/db";

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: number;
}

export interface ChatMessagesProps {
  currentConversation?: Conversation;
}

export interface SidebarProps {
  conversations?: Conversation[];
  currentConversationId: number | null;
  sidebarCollapsed: boolean;
  onNewChat: () => void;
  onDeleteConversation: (id: number) => void;
  onSelectConversation: (id: number) => void;
}

export interface ChatHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  currentConversation?: Conversation;
  currentConversationId: number | null;
  onDeleteConversation: (id: number) => void;
}
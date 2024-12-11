import { ConversationContextType } from "@/hooks/useConversationManager";
import React from "react";

export const ConversationContext = React.createContext<ConversationContextType | null>(null);

export const useConversation = () => {
  const context = React.useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

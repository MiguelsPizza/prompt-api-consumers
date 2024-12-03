import { ConversationContextType } from "@/hooks/useConversationManager";
import { SupabaseConnector } from "@/powersync/SupabaseConnector";
import React from "react";

export const SupabaseContext = React.createContext<SupabaseConnector | null>(null);
export const useSupabase = () => {
  const context = React.useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};


export const ConversationContext = React.createContext<ConversationContextType | null>(null);

export const useConversation = () => {
  const context = React.useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

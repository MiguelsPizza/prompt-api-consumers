import type { SupportedLLMModel } from '@/entrypoints/background/lib/supportedModels';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { trpc } from '../trpcClient';

interface CurrentModelContextValue {
  currentModel: SupportedLLMModel | null;
}

const CurrentModelContext = createContext<CurrentModelContextValue | undefined>(undefined);

interface CurrentModelProviderProps {
  children: ReactNode;
}

/**
 * The provider sets up a live subscription to the current model
 * and provides its value via context.
 */
export const CurrentModelProvider: React.FC<CurrentModelProviderProps> = ({ children }) => {
  const [currentModel, setCurrentModel] = useState<SupportedLLMModel | null>(null);

  // Subscribe to changes in the current model from the backend.
  trpc.models.liveCurrentModel.useSubscription(undefined, {
    onData(data) {
      setCurrentModel(data);
    },
    onError(error) {
      console.error('Error with liveCurrentModel subscription:', error);
    },
  });

  return (
    <CurrentModelContext.Provider value={{ currentModel }}>
      {children}
    </CurrentModelContext.Provider>
  );
};

/**
 * Custom hook to access the current model
 * Usage: const { currentModel } = useCurrentModel();
 */
export function useCurrentModel() {
  const context = useContext(CurrentModelContext);
  if (context === undefined) {
    throw new Error('useCurrentModel must be used within a CurrentModelProvider');
  }
  return context;
}
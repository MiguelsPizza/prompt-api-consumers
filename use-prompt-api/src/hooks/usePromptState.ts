import { useState, useCallback } from 'react';
import { ModelConversation } from './types';

interface PromptState {
  history: ModelConversation;
  response: string | null;
  loading: boolean;
  error: Error | null;
  abortController: AbortController | null;
}

export function usePromptState(initialPrompts: ModelConversation = []) {
  const [state, setState] = useState<PromptState>({
    history: initialPrompts,
    response: null,
    loading: false,
    error: null,
    abortController: null
  });

  const setPartialState = useCallback((partial: Partial<PromptState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  return {
    ...state,
    setState: setPartialState
  };
}

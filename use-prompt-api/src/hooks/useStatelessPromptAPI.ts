import { useCallback, useEffect, useRef, useState } from 'react';
import { BasePromptAPIResult, ModelConversation } from './types';

interface StatelessPromptAPIOptions {
  modelOptions: AILanguageModelCreateOptionsWithSystemPrompt;
}

export function useStatelessPromptAPI(
  options: StatelessPromptAPIOptions
): BasePromptAPIResult {
  const { modelOptions } = options;

  // Refs
  const mountedRef = useRef<boolean>(true);
  const accumulatedResponseRef = useRef<string>('');

  // State
  const [available, setAvailable] = useState<AICapabilityAvailability>('no');
  const [capabilities, setCapabilities] = useState<AILanguageModelCapabilities | null>(null);
  const [history, setHistory] = useState<ModelConversation>([]);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      if (!window.ai?.languageModel?.capabilities) {
        setAvailable('no');
        setError(new Error('Language Model API not available'));
        return;
      }

      try {
        const caps = await window.ai.languageModel.capabilities();
        if (mountedRef.current) {
          setCapabilities(caps);
          setAvailable(caps.available);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to check capabilities'));
        }
      }
    };

    checkCapabilities();
  }, []);

  const sendPrompt = useCallback(async (
    input: string,
    options: AILanguageModelPromptOptions & { streaming?: boolean } = {}
  ): Promise<void> => {
    const { streaming = false, signal } = options;

    if (!input?.trim()) {
      setError(new Error('Input cannot be empty'));
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    accumulatedResponseRef.current = '';

    const controller = new AbortController();
    setAbortController(controller);
    const combinedSignal = signal
      ? AbortSignal.any([signal, controller.signal])
      : controller.signal;

    let session: AILanguageModel | null = null;

    try {
      session = await window.ai.languageModel.create({
        ...modelOptions,
        initialPrompts: history,
        signal: combinedSignal,
      } as AILanguageModelCreateOptionsWithSystemPrompt);

      const userPrompt: AILanguageModelUserPrompt = { role: 'user', content: input };
      setHistory(prev => [...prev, userPrompt]);

      if (streaming) {
        const stream = session.promptStreaming(input, { signal: combinedSignal });
        const reader = stream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulatedResponseRef.current = value;
          if (mountedRef.current) {
            setResponse(value);
          }
        }

        if (mountedRef.current) {
          setHistory(prev => [...prev, {
            role: 'assistant',
            content: accumulatedResponseRef.current
          }]);
        }
      } else {
        const result = await session.prompt(input, { signal: combinedSignal });

        if (mountedRef.current) {
          setResponse(result);
          setHistory(prev => [...prev, { role: 'assistant', content: result }]);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError' && mountedRef.current) {
        setError(err);
      }
    } finally {
      session?.destroy();
      if (mountedRef.current) {
        setLoading(false);
        setAbortController(null);
      }
    }
  }, [modelOptions, history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setResponse(null);
    accumulatedResponseRef.current = '';
  }, []);

  const abort = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setLoading(false);
  }, [abortController]);

  const getTokenCount = useCallback(async (): Promise<number | null> => {
    try {
      const session = await window.ai.languageModel.create(modelOptions);
      const count = await session.countPromptTokens(
        history.reduce((str, { content }) => `${str}\n${content}`, '')
      );
      session.destroy();
      return count;
    } catch (err) {
      console.error('Failed to count tokens:', err);
      return null;
    }
  }, [modelOptions, history]);

  const reset = useCallback(async () => {
    abort();
    clearHistory();
  }, [abort, clearHistory]);

  return {
    available,
    capabilities,
    history,
    response,
    loading,
    error,
    abortController,
    sendPrompt,
    clearHistory,
    abort,
    getTokenCount,
    reset,
  };
}

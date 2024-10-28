import { useCallback, useEffect, useRef, useState } from 'react';
import { BasePromptAPIResult, ModelConversation } from './types';

interface SessionPromptAPIOptions {
  modelOptions: AILanguageModelCreateOptionsWithSystemPrompt;
}

interface SessionPromptAPIResult extends BasePromptAPIResult {
  session: AILanguageModel | null;
}

export function useSessionPromptAPI(
  options: SessionPromptAPIOptions
): SessionPromptAPIResult {
  const { modelOptions } = options;
  const {
    systemPrompt,
    initialPrompts = [],
    signal: creationSignal,
  } = modelOptions;

  // Refs
  const sessionRef = useRef<AILanguageModel | null>(null);
  const mountedRef = useRef<boolean>(true);
  const accumulatedResponseRef = useRef<string>('');


  // State
  const [available, setAvailable] = useState<AICapabilityAvailability>('no');
  const [capabilities, setCapabilities] = useState<AILanguageModelCapabilities | null>(null);
  const [history, setHistory] = useState<ModelConversation>(initialPrompts);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      sessionRef.current?.destroy();
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

  // Session management
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const createNewSession = async () => {
      try {
        if (!window.ai?.languageModel?.create) {
          throw new Error('Language Model API not available');
        }

        const newSession = await window.ai.languageModel.create({
          ...modelOptions,
          signal: creationSignal || controller.signal,
        });

        if (mountedRef.current) {
          sessionRef.current = newSession;
          setLoading(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to create session'));
          setLoading(false);
        }
      }
    };

    createNewSession();

    return () => {
      controller.abort();
      sessionRef.current?.destroy();
    };
  }, [systemPrompt, JSON.stringify(initialPrompts), JSON.stringify(modelOptions), creationSignal]);

  const sendPrompt = useCallback(async (
    input: string,
    options:  AILanguageModelPromptOptions & { streaming?: boolean }  =  {}
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

    try {
      if (!sessionRef.current) {
        throw new Error('No active session');
      }

      const userPrompt: AILanguageModelUserPrompt = { role: 'user', content: input };
      setHistory(prev => [...prev, userPrompt]);

      if (streaming) {
        const stream = sessionRef.current.promptStreaming(input, { signal: combinedSignal });
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
        const result = await sessionRef.current.prompt(input, { signal: combinedSignal });

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
      if (mountedRef.current) {
        setLoading(false);
        setAbortController(null);
      }
    }
  }, []);

  // Utility functions
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
    if (!sessionRef.current) return null;

    try {
      return await sessionRef.current.countPromptTokens(
        history.reduce((str, { content }) => `${str}\n${content}`, '')
      );
    } catch (err) {
      console.error('Failed to count tokens:', err);
      return null;
    }
  }, [history]);

  const reset = useCallback(async () => {
    abort();
    clearHistory();
    setLoading(true);

    try {
      const newSession = await window.ai.languageModel.create({
        ...modelOptions,
      });

      if (mountedRef.current) {
        sessionRef.current?.destroy();
        sessionRef.current = newSession;
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to reset session'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [modelOptions, abort, clearHistory]);

  return {
    available,
    capabilities,
    session: sessionRef.current,
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

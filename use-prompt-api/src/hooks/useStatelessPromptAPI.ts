import { useCallback, useEffect, useState } from 'react';
import { ModelConversation } from './types';

interface StatelessPromptAPIResult {
  available: AICapabilityAvailability;
  capabilities: AILanguageModelCapabilities | null;
  response: string | null;
  loading: boolean;
  error: Error | null;
  abortController: AbortController | null;
  sendPrompt: (input: string, options?: AILanguageModelPromptOptions & {
    streaming?: boolean;
    history?: ModelConversation;
  }) => Promise<void | string>;
  abort: () => void;
  getTokenCount: (history: ModelConversation) => Promise<number | null>;
}

export function useStatelessPromptAPI(sessionOptions: Omit<AILanguageModelCreateOptionsWithSystemPrompt, 'initialPrompts'>): StatelessPromptAPIResult {
  const [available, setAvailable] = useState<AICapabilityAvailability>('no');
  const [capabilities, setCapabilities] = useState<AILanguageModelCapabilities | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    const checkCapabilities = async () => {
      if (!window.ai?.languageModel?.capabilities) {
        setAvailable('no');
        setError(new Error('Language Model API not available'));
        return;
      }

      try {
        const caps = await window.ai.languageModel.capabilities();
        setCapabilities(caps);
        setAvailable(caps.available);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to check capabilities'));
      }
    };

    checkCapabilities();

  }, []);

  // useEffect(() => {
  //   return () => {
  //     abortController?.abort()
  //   }
  // })

  const sendPrompt = useCallback(async (
    input: string,
    promptOptions: AILanguageModelPromptOptions & {
      streaming?: boolean;
      history?: ModelConversation;
    } = {}
  ): Promise<void | string> => {
    const { streaming = false, signal, history = [] } = promptOptions;
    if (!input?.trim()) {
      setError(new Error('Input cannot be empty'));
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    const controller = new AbortController();
    const sessionAbortSignal: AbortSignal[] = sessionOptions.signal ? [sessionOptions.signal] : []
    const promptAbortSignal: AbortSignal[] = signal ? [signal] : []

    setAbortController(controller);
    const combinedSignal = AbortSignal.any([controller.signal, ...promptAbortSignal, ...sessionAbortSignal])

    let session: AILanguageModel | null = null;
    const promptsWSession = sessionOptions.systemPrompt ? [{role: 'system', content: sessionOptions.systemPrompt}, ...history] : history
    try {
      session = await window.ai.languageModel.create({
        monitor: sessionOptions.monitor,
        temperature: sessionOptions.temperature,
        topK: sessionOptions.topK,
        initialPrompts: promptsWSession,
        signal: combinedSignal,
      } as AILanguageModelCreateOptionsWithSystemPrompt);

      if (streaming) {
        const stream = session.promptStreaming(input, { signal: combinedSignal });
        const reader = stream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) return value;
          setResponse(value);
        }
      } else {
        const result = await session.prompt(input, { signal: combinedSignal });
        setResponse(result);
        return result
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      session?.destroy();
      setLoading(false);
      setAbortController(null);
    }
  }, [sessionOptions]);

  const abort = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setLoading(false);
  }, [abortController]);

  const getTokenCount = useCallback(async (history: ModelConversation): Promise<number | null> => {
    try {
      const session = await window.ai.languageModel.create(sessionOptions);
      const count = await session.countPromptTokens(
        history.reduce((str, { content }) => `${str}\n${content}`, '')
      );
      session.destroy();
      return count;
    } catch (err) {
      console.error('Failed to count tokens:', err);
      return null;
    }
  }, [sessionOptions]);

  return {
    available,
    capabilities,
    response,
    loading,
    error,
    abortController,
    sendPrompt,
    abort,
    getTokenCount,
  };
}
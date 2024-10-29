import { useCallback, useEffect, useRef, useState } from 'react';

interface StatelessPromptAPIResult {
  available: AICapabilityAvailability;
  capabilities: AILanguageModelCapabilities | null;
  streamingResponse: string | null;
  loading: boolean;
  error: Error | null;
  abortController: AbortController | null;
  sendPrompt: (input: string, options?: AILanguageModelPromptOptions & {
    streaming?: boolean;
  }) => Promise<void | string | null>;
  abort: () => void;
  sessionTokens: number
}

export function useStatelessPromptAPI({ initialPrompts = [], monitor, signal, systemPrompt, temperature, topK }: AILanguageModelCreateOptionsWithSystemPrompt): StatelessPromptAPIResult {
  const [available, setAvailable] = useState<AICapabilityAvailability>('no');
  const [capabilities, setCapabilities] = useState<AILanguageModelCapabilities | null>(null);
  const [streamingResponse, setStreamingResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [sessionTokens, setSessionTokens] = useState<number>(0)

  const session = useRef<AILanguageModel | null>(null)

  useEffect(() => {
    (async () => {
      // Cleanup previous session before creating new one
      if (session.current) {
        session.current.destroy();
        session.current = null;
      }

      if (available === 'readily' || available === 'after-download') {
        console.log('creating session')
        const promptsWSession = systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...initialPrompts]
          : initialPrompts

        try {
          session.current = await window.ai.languageModel.create({
            monitor: monitor,
            temperature: temperature,
            topK: topK,
            initialPrompts: promptsWSession,
            signal: signal,
          } as AILanguageModelCreateOptionsWithSystemPrompt);
        } catch (err) {
          console.error('Failed to create session:', err);
          setError(err instanceof Error ? err : new Error('Failed to create session'));
        }
      }
    })()
  }, [available, systemPrompt, initialPrompts, monitor, temperature, topK, signal])

  useEffect(() => {
    return () => {
      if (session.current) {
        session.current.destroy();
        session.current = null;
      }
    };
  }, []);



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

  const sendPrompt = useCallback(async (
    input: string,
    promptOptions: AILanguageModelPromptOptions & { streaming?: boolean; } = {}
  ): Promise<void | string | null> => {
    const { streaming = false, signal } = promptOptions;
    if (!input?.trim()) {
      setError(new Error('Input cannot be empty'));
      return;
    }

    setLoading(true);
    setError(null);
    setStreamingResponse(null);

    const controller = new AbortController();
    const sessionAbortSignal: AbortSignal[] = signal ? [signal] : []
    const promptAbortSignal: AbortSignal[] = signal ? [signal] : []

    setAbortController(controller);
    const combinedSignal = AbortSignal.any([controller.signal, ...promptAbortSignal, ...sessionAbortSignal])
    try {
      if (!session.current) throw new Error('Session not availible')
      if (streaming) {
        const stream = session.current.promptStreaming(input, { signal: combinedSignal });
        const reader = stream.getReader();
        let returnVal: string | null = null
        while (true) {
          const { done, value } = await reader.read();
          returnVal = value || returnVal
          if (done) {
            console.log({ done, value })
            return returnVal
          };
          setStreamingResponse(value);
        }
      } else {
        const result = await session.current.prompt(input, { signal: combinedSignal });
        setStreamingResponse(result);
        return result
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
      throw err
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }, [signal]);

  const abort = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setLoading(false);
  }, [abortController]);

  useEffect(() => {
    if (!session.current) return
    const historyStr = initialPrompts?.map(({ content }) => content).join('') ?? ''
    const systemStr = systemPrompt ?? ''
    session.current.countPromptTokens(
      [historyStr, systemStr].reduce((str, content) => `${str}${content}`)
      ,).then((count) => setSessionTokens(count))
  }, [initialPrompts, systemPrompt]);

  return {
    available,
    capabilities,
    streamingResponse,
    loading,
    error,
    abortController,
    sendPrompt,
    sessionTokens,
    abort
  };
}
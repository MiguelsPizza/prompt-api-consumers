import { useCallback, useEffect, useRef, useState } from 'react';

export interface IPromptAPIError {
  readonly code:
  | 'SESSION_UNAVAILABLE'
  | 'SESSION_CREATION_FAILED'
  | 'PROMPT_FAILED'
  | 'EMPTY_PROMPT';
  name: string;
  message: string;
}

class PromptAPIError<
  T extends
  | 'SESSION_UNAVAILABLE'
  | 'SESSION_CREATION_FAILED'
  | 'PROMPT_FAILED'
  | 'EMPTY_PROMPT',
>
  extends Error
  implements IPromptAPIError {
  constructor(
    message: string,
    public readonly code: T,
  ) {
    super(message);
    this.name = 'PromptAPIError';
  }
}

export type UseStatelessPromptAPIError = PromptAPIError<
  | 'SESSION_UNAVAILABLE'
  | 'SESSION_CREATION_FAILED'
  | 'PROMPT_FAILED'
  | 'EMPTY_PROMPT'
>;

interface StatelessPromptAPIResult {
  streamingResponse: string | null;
  loading: boolean;
  error: UseStatelessPromptAPIError | null;
  abortController: AbortController | null;
  sendPrompt: (
    input: string,
    options?: AILanguageModelPromptOptions & {
      streaming?: boolean;
    },
  ) => Promise<void | string | null>;
  abort: () => void;
  sessionTokens: number;
  session: AILanguageModel | null;
  sessionAvailable: boolean;
}

export function useStatelessPromptAPI({
  initialPrompts = [],
  monitor,
  signal,
  systemPrompt,
  temperature,
  topK,
}: AILanguageModelCreateOptionsWithSystemPrompt): StatelessPromptAPIResult {
  const [streamingResponse, setStreamingResponse] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<UseStatelessPromptAPIError | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [sessionTokens, setSessionTokens] = useState<number>(0);

  const session = useRef<AILanguageModel | null>(null);

  useEffect(() => {
    if (session.current) {
      session.current.destroy();
      session.current = null;
    }

    if (
      !window.ai ||
      !window.ai.languageModel ||
      !window.ai.languageModel.create
    ) return console.warn('no .ai on the window')

    const initialPromptsWithSystem = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...initialPrompts]
      : initialPrompts;

    window.ai.languageModel
      .create({
        monitor,
        temperature,
        topK,
        initialPrompts: initialPromptsWithSystem,
        signal,
      } as AILanguageModelCreateOptionsWithSystemPrompt)
      .then((newSession) => {
        console.log('creating session')
        session.current = newSession;
      })
      .catch((err) => {
        console.error(error)
        setError(
          new PromptAPIError(
            err instanceof Error ? err.message : 'Failed to create session',
            'SESSION_CREATION_FAILED',
          ),
        );
      });
  }, [systemPrompt, initialPrompts, monitor, temperature, topK, signal]);

  useEffect(() => {
    return () => {
      if (session.current) {
        session.current.destroy();
        session.current = null;
      }
    };
  }, []);

  const sendPrompt = useCallback(
    async (
      input: string,
      promptOptions: AILanguageModelPromptOptions & {
        streaming?: boolean;
      } = {},
    ): Promise<void | string | null> => {
      const { streaming = false, signal } = promptOptions;
      if (!input?.trim()) {
        setError(new PromptAPIError('Input cannot be empty', 'EMPTY_PROMPT'));
        return;
      }

      setLoading(true);
      setError(null);
      setStreamingResponse(null);

      const controller = new AbortController();
      const sessionAbortSignal: AbortSignal[] = signal ? [signal] : [];
      const promptAbortSignal: AbortSignal[] = signal ? [signal] : [];

      setAbortController(controller);
      const combinedSignal = AbortSignal.any([
        controller.signal,
        ...promptAbortSignal,
        ...sessionAbortSignal,
      ]);
      try {
        if (!session.current)
          throw new PromptAPIError(
            'Session not available',
            'SESSION_UNAVAILABLE',
          );
        if (streaming) {
          const stream = session.current.promptStreaming(input, {
            signal: combinedSignal,
          });
          const reader = stream.getReader();
          let returnVal: string | null = null;
          while (true) {
            const { done, value } = await reader.read();
            returnVal = value || returnVal;
            if (done) {
              console.log({ done, value });
              return returnVal;
            }
            setStreamingResponse(value);
          }
        } else {
          const result = await session.current.prompt(input, {
            signal: combinedSignal,
          });
          setStreamingResponse(result);
          return result;
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }
        if (err instanceof PromptAPIError) {
          throw err;
        }
        throw new PromptAPIError(
          err instanceof Error ? err.message : 'Failed to process prompt',
          'PROMPT_FAILED',
        );
      } finally {
        setLoading(false);
        setAbortController(null);
      }
    },
    [signal],
  );

  const abort = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setLoading(false);
  }, [abortController]);

  useEffect(() => {
    if (!session.current) return;
    const historyStr =
      initialPrompts?.map(({ content }) => content).join('') ?? '';
    const systemStr = systemPrompt ?? '';
    session.current
      .countPromptTokens(
        [historyStr, systemStr].reduce((str, content) => `${str}${content}`),
      )
      .then((count) => setSessionTokens(count));
  }, [initialPrompts, systemPrompt]);

  return {
    streamingResponse,
    loading,
    error,
    abortController,
    sendPrompt,
    sessionTokens,
    abort,
    session: session.current,
    sessionAvailable: Boolean(session?.current)
  };
}

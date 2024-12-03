import { useCallback, useEffect, useState } from 'react';

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
  loading: boolean;
  error: UseStatelessPromptAPIError | null;
  abortController: AbortController | null;
  sendPrompt: (
    input: string,
    options?: AILanguageModelPromptOptions & {
      streaming?: boolean;
      onToken?: (response: string) => void | Promise<void>;
    },
  ) => Promise<void | string | null>;
  abort: () => void;
  session: AILanguageModel | null;
  isResponding: boolean;
  isThinking: boolean;
}

export function useStatelessPromptAPI(sessionId: string | number | Symbol, {
  initialPrompts = [],
  monitor,
  signal,
  systemPrompt,
  temperature,
  topK,
}: AILanguageModelCreateOptionsWithSystemPrompt): StatelessPromptAPIResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<UseStatelessPromptAPIError | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [session, setSession] = useState<AILanguageModel | null>(null);
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  useEffect(() => {
    if (session) {
      console.warn('deleting session')
      session.destroy();
      setSession(null)
    }

    if (
      !window.ai ||
      !window.ai.languageModel ||
      !window.ai.languageModel.create
    ) return console.warn('no .ai on the window')

    const initialPromptsWithSystem = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...initialPrompts]
      : initialPrompts;
    console.log('creating new session')
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
        setSession(newSession)
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
    return () => {
      if (session) {
        console.warn('cleaning up session')

        session.destroy();
        setSession(null)
      }
    };
  }, [systemPrompt, monitor, temperature, topK, signal, sessionId]);

  useEffect(() => {

  }, [session]);

  const sendPrompt = useCallback(
    async (
      input: string,
      promptOptions: AILanguageModelPromptOptions & {
        streaming?: boolean;
        onToken?: (response: string) => void | Promise<void>;
      } = {},
    ): Promise<void | string | null> => {
      const { streaming = false, signal, onToken } = promptOptions;
      if (!input?.trim()) {
        setError(new PromptAPIError('Input cannot be empty', 'EMPTY_PROMPT'));
        return;
      }

      setLoading(true);
      setError(null);
      setIsResponding(true);
      setIsThinking(true);

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
        if (!session)
          throw new PromptAPIError(
            'Session not available',
            'SESSION_UNAVAILABLE',
          );

        if (streaming) {
          const stream = session.promptStreaming(input, {
            signal: combinedSignal,
          });
          const reader = stream.getReader();
          let returnVal: string | null = null;
          while (true) {
            try {
              const { done, value } = await reader.read();
              if (value) {
                setIsThinking(false);
              }
              returnVal = value || returnVal;
              if (done) {
                console.log({ done, value });
                return returnVal;
              }
              if (onToken && value) {
                await onToken(value);
              }
            } catch (err) {
              if (err instanceof Error && err.name === 'AbortError') {
                return returnVal;
              }
              throw err;
            }
          }
        } else {
          setIsThinking(true);
          const result = await session.prompt(input, {
            signal: combinedSignal,
          });
          return result;
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return null;
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
        setIsResponding(false);
        setIsThinking(false);
      }
    },
    [signal, session],
  );

  const abort = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setLoading(false);
  }, [abortController]);

  return {
    loading,
    error,
    abortController,
    sendPrompt,
    abort,
    session,
    isResponding,
    isThinking,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ISummarizerError {
  readonly code: 'SESSION_UNAVAILABLE' | 'SESSION_CREATION_FAILED' | 'SUMMARIZE_FAILED' | 'EMPTY_INPUT';
  name: string;
  message: string;
}

class SummarizerError<T extends 'SESSION_UNAVAILABLE' | 'SESSION_CREATION_FAILED' | 'SUMMARIZE_FAILED' | 'EMPTY_INPUT'>
  extends Error
  implements ISummarizerError
{
  constructor(
    message: string,
    public readonly code: T,
  ) {
    super(message);
    this.name = 'SummarizerError';
  }
}

export type UseSummarizerError = SummarizerError<
  'SESSION_UNAVAILABLE' | 'SESSION_CREATION_FAILED' | 'SUMMARIZE_FAILED' | 'EMPTY_INPUT'
>;

interface UseSummarizerResult {
  streamingResponse: string | null;
  loading: boolean;
  error: UseSummarizerError | null;
  abortController: AbortController | null;
  summarize: (
    input: string,
    options?: AISummarizerSummarizeOptions & {
      streaming?: boolean;
    },
  ) => Promise<void | string | null>;
  abort: () => void;
}

export function useSummarizer({
  type = 'tl;dr',
  format = 'plain-text',
  length = 'medium',
  monitor,
  signal,
  sharedContext,
}: AISummarizerCreateOptions = {}): UseSummarizerResult {
  const [streamingResponse, setStreamingResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<UseSummarizerError | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const session = useRef<AISummarizer | null>(null);

  useEffect(() => {
    if (session.current) {
      session.current.destroy();
      session.current = null;
    }

    window.ai.summarizer
      .create({
        type,
        format,
        length,
        monitor,
        signal,
        sharedContext,
      })
      .then((newSession) => {
        session.current = newSession;
      })
      .catch((err) => {
        setError(
          new SummarizerError(
            err instanceof Error ? err.message : 'Failed to create session',
            'SESSION_CREATION_FAILED',
          ),
        );
      });
  }, [type, format, length, monitor, signal, sharedContext]);

  useEffect(() => {
    return () => {
      if (session.current) {
        session.current.destroy();
        session.current = null;
      }
    };
  }, []);

  const summarize = useCallback(
    async (
      input: string,
      options: AISummarizerSummarizeOptions & {
        streaming?: boolean;
      } = {},
    ): Promise<void | string | null> => {
      const { streaming = false, signal, context } = options;
      if (!input?.trim()) {
        setError(new SummarizerError('Input cannot be empty', 'EMPTY_INPUT'));
        return;
      }

      setLoading(true);
      setError(null);
      setStreamingResponse(null);

      const controller = new AbortController();
      setAbortController(controller);
      const combinedSignal = signal ? AbortSignal.any([controller.signal, signal]) : controller.signal;

      try {
        if (!session.current) {
          throw new SummarizerError('Session not available', 'SESSION_UNAVAILABLE');
        }

        if (streaming) {
          const stream = session.current.summarizeStreaming(input, {
            signal: combinedSignal,
            context,
          });
          const reader = stream.getReader();
          let returnVal: string | null = null;
          while (true) {
            const { done, value } = await reader.read();
            returnVal = value || returnVal;
            if (done) {
              return returnVal;
            }
            setStreamingResponse(value);
          }
        } else {
          const result = await session.current.summarize(input, {
            signal: combinedSignal,
            context,
          });
          setStreamingResponse(result);
          return result;
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }
        throw new SummarizerError(
          err instanceof Error ? err.message : 'Failed to summarize text',
          'SUMMARIZE_FAILED',
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

  return {
    streamingResponse,
    loading,
    error,
    abortController,
    summarize,
    abort,
  };
}
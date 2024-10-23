// @ts-types="npm:@types/react@^18.3.11"
import { useCallback, useState } from 'react';

interface PromptOptions {
  /** Whether to use streaming mode for the response */
  streaming?: boolean;
}

/**
 * A custom React hook for interacting with an AI language model.
 *
 * This hook provides functionality to send prompts to an AI language model
 * and receive responses, with support for both streaming and non-streaming modes.
 *
 * @param session An initialized AILanguageModel session
 * @returns An object containing the response, streaming response, loading state, error state, abort controller, and a function to send prompts
 *
 * @example
 * // Using the hook in a component
 * const MyComponent = () => {
 *   const session = useLanguageModel(); // Assume this hook exists to create a session
 *   const { response, streamResponse, loading, error, abortController, sendPrompt } = useLanguageModelPrompt(session);
 *
 *   const handleSendPrompt = async () => {
 *     try {
 *       await sendPrompt("Tell me a joke", { streaming: true });
 *       // Use abortController if needed to abort the request
 *     } catch (error) {
 *       console.error("Error sending prompt:", error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSendPrompt} disabled={loading}>Send Prompt</button>
 *       {loading && <p>Loading...</p>}
 *       {error && <p>Error: {error.message}</p>}
 *       {streamResponse && <p>Streaming Response: {streamResponse}</p>}
 *       {response && <p>Final Response: {response}</p>}
 *     </div>
 *   );
 * };
 */
export function useLanguageModelPrompt(
  /** An initialized AILanguageModel session */
  session: AILanguageModel | null,
): {
  /** The final response from the AI model (null if streaming or not yet received) */
  response: string | null;
  /** Indicates whether a prompt is currently being processed */
  loading: boolean;
  /** Any error that occurred during the prompt processing */
  error: Error | null;
  /** The current AbortController for the ongoing request, if any */
  abortController: AbortController | null;
  /**
   * Function to send a prompt to the AI model
   * @param input The prompt text to send to the AI model
   * @param options Optional settings for the prompt
   * @returns A Promise that resolves when the prompt is returned
   */
  sendPrompt: (input: string, options?: PromptOptions) => Promise<void>;
} {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const sendPrompt = useCallback(
    async (input: string, options?: PromptOptions): Promise<void> => {
      if (!session) {
        throw new Error('Session not initialized');
      }

      setLoading(true);
      setError(null);
      setResponse(null);

      const newAbortController = new AbortController();
      setAbortController(newAbortController);
      const { signal } = newAbortController;

      try {
        if (options?.streaming) {
          const stream = session.promptStreaming(input, { signal });
          const reader = stream.getReader();

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            setResponse(value);
          }
        } else {
          const result = await session.prompt(input, { signal });
          setResponse(result);
        }
      } catch (err) {
        if (!(err instanceof Error)) {
          const error =
            typeof err === 'string'
              ? new Error(err)
              : new Error('Unknown error occurred');
          setError(error);
        } else if (err.name !== 'AbortError') {
          setError(err as Error);
        }
      } finally {
        setLoading(false);
        setAbortController(null);
      }
    },
    [session],
  );

  return {
    response,
    loading,
    error,
    sendPrompt,
    abortController,
  };
}

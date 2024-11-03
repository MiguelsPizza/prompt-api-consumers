// import { useCallback, useEffect, useRef, useState } from 'react';

// /**
//  * Configuration options for the optimized language model hook
//  */
// interface OptimizedLanguageModelOptions {
//   /** Whether to use session-based conversation (true) or stateless mode (false) */
//   useSession?: boolean;

//   /** Options for configuring the language model, including system prompt and initial prompts */
//   modelOptions?: AILanguageModelCreateOptionsWithSystemPrompt | AILanguageModelCreateOptionsWithoutSystemPrompt
// }

// /**
//  * Options for sending prompts to the model
//  */
// interface PromptOptions {
//   /** Whether to use streaming mode for receiving responses chunk by chunk */
//   streaming?: boolean;
//   /** Optional signal for aborting the prompt request */
//   signal?: AbortSignal;
//   /** Whether to clear conversation history before sending the prompt */
//   clearHistory?: boolean;
// }

// /**
//  * Result object returned by the optimized hook
//  */
// interface UseOptimizedLanguageModelResult {
//   /** The availability status of the AI language model ('yes', 'no', or 'unknown') */
//   available: AICapabilityAvailability;
//   /** The capabilities of the AI language model, if available */
//   capabilities: AILanguageModelCapabilities | null;
//   /** The current active session (if using session mode) */
//   session: AILanguageModel | null;
//   /** The full conversation history including user and assistant messages */
//   history: ModelConversation;
//   /** The most recent response from the model (null if no response yet) */
//   response: string | null;
//   /** Whether a prompt request is currently in progress */
//   loading: boolean;
//   /** Any error that occurred during the last operation */
//   error: Error | null;
//   /** The current abort controller for canceling ongoing requests */
//   abortController: AbortController | null;
//   /** Send a prompt to the model with optional streaming and abort control */
//   sendPrompt: (input: string, options?: PromptOptions) => Promise<void>;
//   /** Clear the conversation history and optionally destroy the current session */
//   clearHistory: () => void;
//   /** Abort any ongoing prompt request */
//   abort: () => void;
//   /** Calculate the total token count of the current conversation */
//   getTokenCount: () => Promise<number | null>;
//   /** Reset the session and history to initial state */
//   reset: () => Promise<void>;
// }

// /**
//  * React hook for interacting with AI language models with session management and streaming support.
//  *
//  * Provides a unified interface for both session-based and stateless interactions,
//  * with built-in state management, error handling, and abort control.
//  *
//  * @param options Configuration options for the language model
//  * @returns An object containing model interaction methods and state
//  *
//  * @example
//  * ```typescript
//  * const {
//  *   sendPrompt,
//  *   response,
//  *   history,
//  *   loading,
//  *   error,
//  *   clearHistory,
//  *   abort,
//  *   getTokenCount,
//  *   reset
//  * } = usePromptAPI({
//  *   useSession: true,
//  *   modelOptions: {
//  *     systemPrompt: "You are a helpful assistant",
//  *     initialPrompts: [],
//  *     monitor: (event) => console.log(event)
//  *   }
//  * });
//  *
//  * // Send a prompt with streaming
//  * await sendPrompt("Hello!", { streaming: true });
//  *
//  * // Abort ongoing request
//  * abort();
//  *
//  * // Reset session
//  * await reset();
//  * ```
//  */
// export function usePromptAPI(
//   options: OptimizedLanguageModelOptions = {}
// ): UseOptimizedLanguageModelResult {
//   const {
//     useSession = true,
//     modelOptions = {},
//   } = options;
//   const {
//     systemPrompt,
//     initialPrompts = [],
//     signal: creationSignal,
//     monitor,
//   } = modelOptions

//   // State management using refs for performance
//   const sessionRef = useRef<AILanguageModel | null>(null);
//   const mountedRef = useRef<boolean>(true);
//   const accumulatedResponseRef = useRef<string>('');

//   // State variables
//   const [available, setAvailable] = useState<AICapabilityAvailability>('no');
//   const [capabilities, setCapabilities] = useState<AILanguageModelCapabilities | null>(null);
//   const [history, setHistory] = useState<ModelConversation>(initialPrompts);
//   const [response, setResponse] = useState<string | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<Error | null>(null);
//   const [abortController, setAbortController] = useState<AbortController | null>(null);
//   // Cleanup on unmountm
//   useEffect(() => {
//     return () => {
//       mountedRef.current = false;
//       sessionRef.current?.destroy();
//     };
//   }, []);

//   // Check availability and capabilities
//   useEffect(() => {
//     const checkCapabilities = async () => {
//       if (!window.ai?.languageModel?.capabilities) {
//         setAvailable('no');
//         setError(new Error('Language Model API not available'));
//         return;
//       }

//       try {
//         const caps = await window.ai.languageModel.capabilities();
//         if (mountedRef.current) {
//           setCapabilities(caps);
//           setAvailable(caps.available);
//         }
//       } catch (err) {
//         if (mountedRef.current) {
//           setError(err instanceof Error ? err : new Error('Failed to check capabilities'));
//         }
//       }
//     };

//     checkCapabilities();
//   }, []);

//   // Session management
//   useEffect(() => {
//     if (!useSession) {
//       return;
//     }

//     const controller = new AbortController();
//     setLoading(true);
//     setError(null);

//     const createNewSession = async () => {
//       try {
//         if (!window.ai?.languageModel?.create) {
//           throw new Error('Language Model API not available');
//         }

//         const newSession = await window.ai.languageModel.create({
//           systemPrompt,
//           initialPrompts,
//           ...modelOptions,
//           signal: creationSignal || controller.signal,
//           monitor
//         }as AILanguageModelCreateOptionsWithSystemPrompt);

//         if (mountedRef.current) {
//           sessionRef.current = newSession;
//           setLoading(false);
//         }
//       } catch (err) {
//         if (mountedRef.current) {
//           setError(err instanceof Error ? err : new Error('Failed to create session'));
//           setLoading(false);
//         }
//       }
//     };

//     createNewSession();

//     return () => {
//       controller.abort();
//       sessionRef.current?.destroy();
//     };
//   }, [useSession, systemPrompt, JSON.stringify(initialPrompts), JSON.stringify(modelOptions), creationSignal]);

//   // Send prompt implementation
//   const sendPrompt = useCallback(async (
//     input: string,
//     options: PromptOptions = {}
//   ): Promise<void> => {
//     const { streaming = false, signal, clearHistory: shouldClearHistory = false } = options;

//     if (!input?.trim()) {
//       setError(new Error('Input cannot be empty'));
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     setResponse(null);
//     accumulatedResponseRef.current = '';

//     const controller = new AbortController();
//     setAbortController(controller);
//     const combinedSignal = signal
//       ? AbortSignal.any([signal, controller.signal])
//       : controller.signal;

//     try {
//       let currentSession = sessionRef.current;

//       if (shouldClearHistory || !useSession || !currentSession) {
//         if (shouldClearHistory) {
//           setHistory([]);
//         }

//         currentSession = await window.ai.languageModel.create({
//           systemPrompt,
//           initialPrompts: shouldClearHistory ? [] : history,
//           ...modelOptions,
//           signal: combinedSignal,
//         } as AILanguageModelCreateOptionsWithSystemPrompt);

//         if (useSession && mountedRef.current) {
//           sessionRef.current = currentSession;
//         }
//       }

//       const userPrompt: AILanguageModelUserPrompt = { role: 'user', content: input };
//       setHistory(prev => [...prev, userPrompt]);

//       if (streaming) {
//         const stream = currentSession.promptStreaming(input, { signal: combinedSignal });
//         const reader = stream.getReader();

//         while (true) {
//           const { done, value } = await reader.read();
//           if (done) break;

//           accumulatedResponseRef.current += value;
//           if (mountedRef.current) {
//             setResponse(accumulatedResponseRef.current);
//           }
//         }

//         if (mountedRef.current) {
//           setHistory(prev => [...prev, {
//             role: 'assistant',
//             content: accumulatedResponseRef.current
//           }]);
//         }
//       } else {
//         const result = await currentSession.prompt(input, { signal: combinedSignal });

//         if (mountedRef.current) {
//           setResponse(result);
//           setHistory(prev => [...prev, { role: 'assistant', content: result }]);
//         }
//       }

//       if (!useSession) {
//         currentSession.destroy();
//       }
//     } catch (err) {
//       if (err instanceof Error && err.name !== 'AbortError' && mountedRef.current) {
//         setError(err);
//       }
//     } finally {
//       if (mountedRef.current) {
//         setLoading(false);
//         setAbortController(null);
//       }
//     }
//   }, [useSession, systemPrompt, modelOptions, history]);

//   // Utility functions
//   const clearHistory = useCallback(() => {
//     setHistory([]);
//     setResponse(null);
//     accumulatedResponseRef.current = '';
//     if (!useSession && sessionRef.current) {
//       sessionRef.current.destroy();
//       sessionRef.current = null;
//     }
//   }, [useSession]);

//   const abort = useCallback(() => {
//     abortController?.abort();
//     setAbortController(null);
//     setLoading(false);
//   }, [abortController]);

//   const getTokenCount = useCallback(async (): Promise<number | null> => {
//     const currentSession = sessionRef.current;
//     if (!currentSession) return null;

//     try {
//       return await currentSession.countPromptTokens(
//         history.reduce((str, { content }) => `${str}\n${content}`, '')
//       );
//     } catch (err) {
//       console.error('Failed to count tokens:', err);
//       return null;
//     }
//   }, [history]);

//   const reset = useCallback(async () => {
//     abort();
//     clearHistory();

//     if (useSession) {
//       setLoading(true);
//       try {
//         const newSession = await window.ai.languageModel.create({
//           systemPrompt,
//           initialPrompts: [],
//           ...modelOptions,
//         } as AILanguageModelCreateOptionsWithSystemPrompt);

//         if (mountedRef.current) {
//           sessionRef.current?.destroy();
//           sessionRef.current = newSession;
//         }
//       } catch (err) {
//         if (mountedRef.current) {
//           setError(err instanceof Error ? err : new Error('Failed to reset session'));
//         }
//       } finally {
//         if (mountedRef.current) {
//           setLoading(false);
//         }
//       }
//     }
//   }, [useSession, systemPrompt, modelOptions, abort, clearHistory]);

//   return {
//     available,
//     capabilities,
//     session: sessionRef.current,
//     history,
//     response,
//     loading,
//     error,
//     abortController,
//     sendPrompt,
//     clearHistory,
//     abort,
//     getTokenCount,
//     reset,
//   };
// }

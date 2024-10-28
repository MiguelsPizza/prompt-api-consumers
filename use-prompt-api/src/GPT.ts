// // useCombinedLanguageModel.ts
// // @ts-types="npm:@types/react@^18.3.11"
// import { useCallback, useEffect, useRef, useState } from 'react';

// interface CombinedLanguageModelOptions {
//   /** Whether to use session-based conversation history (true) or stateless mode (false) */
//   useSession?: boolean;
//   /** Initial system prompt for the conversation */
//   systemPrompt?: string;
//   /** Initial prompts to seed the conversation */
//   initialPrompts?: (AILanguageModelAssistantPrompt | AILanguageModelUserPrompt)[];
//   /** Configuration options for the language model */
//   modelOptions?: {
//     temperature?: number;
//     topK?: number;
//   };
//   /** Abort signal for the model creation */
//   signal?: AbortSignal;
//   /** Callback for monitoring model download progress */
//   onDownloadProgress?: (progress: number) => void;
// }

// interface PromptOptions {
//   /** Whether to use streaming mode for the response */
//   streaming?: boolean;
//   /** Abort signal for the prompt */
//   signal?: AbortSignal;
//   /** Whether to clear conversation history before sending the prompt */
//   clearHistory?: boolean;
// }

// interface UseCombinedLanguageModelResult {
//   /** The availability status of the AI language model */
//   available: AICapabilityAvailability;
//   /** The AI language model capabilities */
//   capabilities: AILanguageModelCapabilities | null;
//   /** The current session (if using session mode) */
//   session: AILanguageModel | null;
//   /** The current conversation history */
//   history: AILanguageModelPrompt[];
//   /** The most recent response from the model */
//   response: string | null;
//   /** Whether any operation is currently in progress */
//   loading: boolean;
//   /** Any error that occurred during operations */
//   error: Error | null;
//   /** The current abort controller for the ongoing request */
//   abortController: AbortController | null;
//   /** The current download progress if model is being downloaded */
//   downloadProgress: number | null;
//   /** Send a prompt to the model */
//   sendPrompt: (input: string, options?: PromptOptions) => Promise<void>;
//   /** Clear the conversation history */
//   clearHistory: () => void;
//   /** Abort the current request */
//   abort: () => void;
// }

// /**
//  * A combined React hook for interacting with an AI language model.
//  *
//  * This hook incorporates the best features from both previous hooks,
//  * supporting both session-based and stateless interactions, providing
//  * utility functions, and handling conversation history and error states.
//  *
//  * @param options Configuration options for the language model interaction
//  * @returns An object containing the session, response, loading state, error state, abort controller, and functions to send prompts
//  *
//  * @example
//  * const {
//  *   available,
//  *   capabilities,
//  *   loading,
//  *   error,
//  *   response,
//  *   sendPrompt,
//  *   abortController,
//  *   clearHistory,
//  * } = useCombinedLanguageModel({ useSession: true });
//  */
// export function useCombinedLanguageModel(
//   options: CombinedLanguageModelOptions = {},
// ): UseCombinedLanguageModelResult {
//   const {
//     useSession = true,
//     systemPrompt,
//     initialPrompts = [],
//     modelOptions = {},
//     signal: creationSignal,
//     onDownloadProgress,
//   } = options;

//   // State variables
//   const [available, setAvailable] = useState<AICapabilityAvailability>('no');
//   const [capabilities, setCapabilities] =
//     useState<AILanguageModelCapabilities | null>(null);
//   const [session, setSession] = useState<AILanguageModel | null>(null);
//   const [history, setHistory] = useState<AILanguageModelPrompt[]>(
//     initialPrompts,
//   );
//   const [response, setResponse] = useState<string | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<Error | null>(null);
//   const [abortController, setAbortController] =
//     useState<AbortController | null>(null);
//   const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

//   // Ref to store the session without causing re-renders
//   const sessionRef = useRef<AILanguageModel | null>(null);

//   // Check availability and capabilities
//   useEffect(() => {
//     let isMounted = true;
//     setLoading(true);
//     setError(null);

//     const checkCapabilities = async () => {
//       if (
//         window.ai &&
//         window.ai.languageModel &&
//         window.ai.languageModel.capabilities
//       ) {
//         try {
//           const caps = await window.ai.languageModel.capabilities();
//           if (isMounted) {
//             setCapabilities(caps);
//             setAvailable(caps.available);
//             setLoading(false);
//           }
//         } catch (err) {
//           if (isMounted) {
//             setError(
//               err instanceof Error ? err : new Error('Unknown error occurred'),
//             );
//             setLoading(false);
//           }
//         }
//       } else {
//         if (isMounted) {
//           setAvailable('no');
//           setLoading(false);
//         }
//       }
//     };

//     checkCapabilities();

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   // Session management
//   useEffect(() => {
//     if (!useSession) {
//       // In stateless mode, no need to create a persistent session
//       setSession(null);
//       sessionRef.current = null;
//       return;
//     }

//     let isMounted = true;
//     const abortCtrl = new AbortController();
//     setLoading(true);
//     setError(null);
//     setDownloadProgress(null);

//     const monitor = (m: AICreateMonitor) => {
//       m.addEventListener('downloadprogress', (e: DownloadProgressEvent) => {
//         if (isMounted) {
//           const progress = e.loaded / e.total;
//           setDownloadProgress(progress);
//           onDownloadProgress?.(progress);
//         }
//       });
//     };

//     const createSession = async () => {
//       try {
//         if (
//           window.ai &&
//           window.ai.languageModel &&
//           window.ai.languageModel.create
//         ) {
//           const createOptions: AILanguageModelCreateOptionsWithSystemPrompt = {
//             systemPrompt,
//             initialPrompts,
//             ...modelOptions,
//             signal: creationSignal || abortCtrl.signal,
//             monitor,
//           };

//           const newSession = await window.ai.languageModel.create(createOptions);

//           if (isMounted) {
//             setSession(newSession);
//             sessionRef.current = newSession;
//             setLoading(false);
//           }
//         } else {
//           if (isMounted) {
//             setError(new Error('Language Model API not available'));
//             setLoading(false);
//           }
//         }
//       } catch (err) {
//         if (isMounted) {
//           setError(
//             err instanceof Error ? err : new Error('Failed to create session'),
//           );
//           setLoading(false);
//         }
//       }
//     };

//     createSession();

//     return () => {
//       isMounted = false;
//       abortCtrl.abort();
//     };
//   }, [
//     useSession,
//     systemPrompt,
//     JSON.stringify(initialPrompts),
//     JSON.stringify(modelOptions),
//     creationSignal,
//   ]);

//   // Function to send a prompt to the AI model
//   const sendPrompt = useCallback(
//     async (input: string, options?: PromptOptions): Promise<void> => {
//       const { streaming = false, signal, clearHistory = false } = options || {};

//       if (typeof input !== 'string') {
//         setError(new Error('Input must be a string or convertible to a string'));
//         return;
//       }

//       const inputString = String(input);
//       if (!inputString.trim()) {
//         setError(new Error('Input cannot be empty'));
//         return;
//       }

//       setLoading(true);
//       setError(null);
//       setResponse(null);

//       const newAbortController = new AbortController();
//       setAbortController(newAbortController);
//       const combinedSignal = signal
//         ? new AbortSignal([signal, newAbortController.signal])
//         : newAbortController.signal;

//       try {
//         let currentSession = sessionRef.current;

//         // In stateless mode or if clearHistory is requested, create a new session
//         if (!useSession || clearHistory || !currentSession) {
//           const createOptions: AILanguageModelCreateOptions = {
//             systemPrompt,
//             initialPrompts: clearHistory ? [] : history,
//             ...modelOptions,
//             signal: combinedSignal,
//           };

//           if (
//             window.ai &&
//             window.ai.languageModel &&
//             window.ai.languageModel.create
//           ) {
//             currentSession = await window.ai.languageModel.create(createOptions);
//             sessionRef.current = currentSession;
//             if (useSession) {
//               setSession(currentSession);
//             }
//           } else {
//             throw new Error('Language Model API not available');
//           }
//         }

//         const userPrompt: AILanguageModelPrompt = {
//           role: 'user',
//           content: input,
//         };

//         // Update conversation history
//         if (clearHistory) {
//           setHistory([userPrompt]);
//         } else {
//           setHistory((prevHistory) => [...prevHistory, userPrompt]);
//         }

//         // Send the prompt
//         if (streaming) {
//           const stream = currentSession.promptStreaming(userPrompt.content!, {
//             signal: combinedSignal,
//           });
//           const reader = stream.getReader();
//           // let accumulatedResponse = '';

//           while (true) {
//             const { done, value } = await reader.read();
//             if (done) break;
//             //accumulatedResponse += value; This is how it should work but they do this for you atm
//             setResponse(value);
//           }

//           setHistory((prevHistory) => [
//             ...prevHistory,
//             { role: 'assistant', content: accumulatedResponse },
//           ]);
//         } else {
//           const result = await currentSession.prompt(userPrompt, {
//             signal: combinedSignal,
//           });
//           setResponse(result);
//           setHistory((prevHistory) => [
//             ...prevHistory,
//             { role: 'assistant', content: result },
//           ]);
//         }
//       } catch (err) {
//         if (err instanceof Error && err.name !== 'AbortError') {
//           setError(err);
//         }
//       } finally {
//         setLoading(false);
//         setAbortController(null);
//       }
//     },
//     [
//       useSession,
//       systemPrompt,
//       modelOptions,
//       history,
//       sessionRef,
//       session,
//       JSON.stringify(history),
//     ],
//   );

//   // Function to clear conversation history
//   const clearHistory = useCallback(() => {
//     setHistory([]);
//     setResponse(null);
//     if (!useSession) {
//       sessionRef.current?.destroy();
//       sessionRef.current = null;
//     }
//   }, [useSession]);

//   // Function to abort ongoing operations
//   const abort = useCallback(() => {
//     abortController?.abort();
//     setAbortController(null);
//     setLoading(false);
//   }, [abortController]);

//   return {
//     available,
//     capabilities,
//     session,
//     history,
//     response,
//     loading,
//     error,
//     abortController,
//     downloadProgress,
//     sendPrompt,
//     clearHistory,
//     abort,
//   };
// }
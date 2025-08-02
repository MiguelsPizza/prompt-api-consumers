export type ModelConversation = LanguageModelMessage[];

export interface BasePromptAPIResult {
  available: Availability;
  capabilities: LanguageModelParams | null;
  history: ModelConversation;
  response: string | null;
  loading: boolean;
  error: Error | null;
  abortController: AbortController | null;
  sendPrompt: (
    input: LanguageModelPrompt,
    options?: LanguageModelPromptOptions,
  ) => Promise<void | string>;
  clearHistory: () => void;
  abort: () => void;
  getTokenCount: () => Promise<number | null>;
  reset: () => Promise<void>;
}
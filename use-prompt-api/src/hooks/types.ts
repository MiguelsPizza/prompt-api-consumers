export type ModelConversation =
  | (AILanguageModelAssistantPrompt | AILanguageModelUserPrompt)[]
  | [
      AILanguageModelSystemPrompt,
      ...(AILanguageModelAssistantPrompt | AILanguageModelUserPrompt)[],
    ];

export interface BasePromptAPIResult {
  available: AICapabilityAvailability;
  capabilities: AILanguageModelCapabilities | null;
  history: ModelConversation;
  response: string | null;
  loading: boolean;
  error: Error | null;
  abortController: AbortController | null;
  sendPrompt: (
    input: string,
    options?: AILanguageModelPromptOptions,
  ) => Promise<void | string>;
  clearHistory: () => void;
  abort: () => void;
  getTokenCount: () => Promise<number | null>;
  reset: () => Promise<void>;
}

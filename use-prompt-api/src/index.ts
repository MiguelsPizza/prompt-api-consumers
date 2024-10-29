// import { useLanguageModel } from './useLanguageModel.ts';
// import { useLanguageModelAvailability } from './useLanguageModelAvailability.ts';
// import { useLanguageModelPrompt } from './useLanguageModelPrompt.ts';
import { useSessionPromptAPI } from "./hooks/useSessionPromptAPI";
import { useStatelessPromptAPI } from "./hooks/useStatelessPromptAPI";
import { ModelConversation } from './hooks/types'

export { useSessionPromptAPI, useStatelessPromptAPI}
export type {ModelConversation}

// export {
//   useLanguageModel,
//   useLanguageModelAvailability,
//   useLanguageModelPrompt,
// };

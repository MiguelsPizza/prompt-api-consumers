// import { useLanguageModel } from './useLanguageModel.ts';
// import { useLanguageModelAvailability } from './useLanguageModelAvailability.ts';
// import { useLanguageModelPrompt } from './useLanguageModelPrompt.ts';
import { useStatelessPromptAPI } from "./hooks/useStatelessPromptAPI";
import { ModelConversation } from './hooks/types'
import { useAICapabilities } from './hooks/useAICapabilities';

export { useAICapabilities, useStatelessPromptAPI }
export type { ModelConversation }

// export {
//   useLanguageModel,
//   useLanguageModelAvailability,
//   useLanguageModelPrompt,
// };

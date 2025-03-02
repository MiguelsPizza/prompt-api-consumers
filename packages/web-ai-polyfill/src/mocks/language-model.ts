/**
 * Default languageModel implementation that throws upon usage,
 * but fulfills the Chrome AI spec shape.
 */
export const defaultLanguageModelFactory: AILanguageModelFactory = {
  create: async () => {
    throw new Error("language Model not implemented");
  },
  capabilities: async () => ({
    defaultTemperature: null,
    defaultTopK: null,
    maxTopK: null,
    available: "no",
    languagePairAvailable: () => "no",
    languageAvailable: () => "no",
  }),
};
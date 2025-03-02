/**
 * Creates a basic mock AITranslatorFactory that throws upon usage,
 * but fulfills the Chrome AI spec shape.
 */
export const mockTranslatorFactory: AITranslatorFactory = {
  create: async () => {
    throw new Error("translator not implemented");
  },
  capabilities: async () => ({
    available: "no",
    languagePairAvailable: () => "no",
  }),
};
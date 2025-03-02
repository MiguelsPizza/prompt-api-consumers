/**
 * Creates a basic mock AILanguageDetectorFactory that throws upon usage,
 * but fulfills the Chrome AI spec shape.
 */
export const mockLanguageDetectorFactory: AILanguageDetectorFactory = {
  create: async () => {
    throw new Error("languageDetector not implemented");
  },
  capabilities: async () => ({
    available: "no",
    languageAvailable: () => "no",
  }),
};
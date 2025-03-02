/**
 * Creates a basic mock AISummarizerFactory that throws upon usage,
 * but fulfills the Chrome AI shape.
 */
export const mockSummarizerFactory: AISummarizerFactory = {
  create: async () => {
    throw new Error("summarizer not implemented");
  },
  capabilities: async () => ({
    available: "no",
    supportsType: () => "no",
    supportsFormat: () => "no",
    supportsLength: () => "no",
    languageAvailable: () => "no",
  }),
};
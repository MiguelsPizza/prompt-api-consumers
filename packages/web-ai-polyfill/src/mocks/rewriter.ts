/**
 * Creates a basic mock AIRewriterFactory that throws upon usage,
 * but fulfills the Chrome AI spec shape.
 */
export const mockRewriterFactory: AIRewriterFactory = {
  create: async () => {
    throw new Error("rewriter not implemented");
  },
  capabilities: async () => ({
    available: "no",
    supportsTone: () => "no",
    supportsFormat: () => "no",
    supportsLength: () => "no",
    languageAvailable: () => "no",
  }),
};
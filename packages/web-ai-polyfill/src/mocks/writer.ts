/**
 * Creates a basic mock AIWriterFactory that throws upon usage,
 * but fulfills the Chrome AI shape.
 */
export const mockWriterFactory: AIWriterFactory = {
  create: async () => {
    throw new Error("writer not implemented");
  },
  capabilities: async () => ({
    available: "no",
    supportsTone: () => "no",
    supportsFormat: () => "no",
    supportsLength: () => "no",
    languageAvailable: () => "no",
  }),
};
import { z } from 'zod'

/**
 * List of all supported models organized by type and engine.
 * As we add more models, they should be added to the appropriate section below.
 */

// Language Models (LLMs)
const supportedLLMs = {
  // MLC-powered models
  mlc: ["SmolLM2-360M-Instruct-q4f16_1-MLC"],
  // TransformersJS-powered models
  transformersJS: ['test'],
} as const

// Embedding Models
const supportedEmbeddingModels = {
  // Add embedding model providers here as needed
  transformersJS: ['test'],
} as const

export const supportedModels = {
  llms: supportedLLMs,
  embeddings: supportedEmbeddingModels,
} as const

// Create union types directly from the supported models
export const SupportedLLMModel = z.enum([
  ...supportedModels.llms.mlc,
  ...supportedModels.llms.transformersJS,
])

export const SupportedEmbeddingModel = z.enum([
  ...supportedModels.embeddings.transformersJS,
])

// Type inference helpers
export type SupportedLLMModel = z.infer<typeof SupportedLLMModel>
export type SupportedEmbeddingModel = z.infer<typeof SupportedEmbeddingModel>
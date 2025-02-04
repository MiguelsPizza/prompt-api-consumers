import { prebuiltAppConfig } from '@mlc-ai/web-llm'
import { z } from 'zod'

/**
 * List of all supported models organized by type and engine.
 * As we add more models, they should be added to the appropriate section below.
 */

// Language Models (LLMs)
const supportedLLMs = {
  // MLC-powered models
  mlc: prebuiltAppConfig.model_list.map(model => model.model_id),
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
export const ZSupportedLLMModel = z.enum([
  'chromeAI',
  ...supportedModels.llms.mlc,
  ...supportedModels.llms.transformersJS,
]);

export const ZSupportedEmbeddingModel = z.enum([
  ...supportedModels.embeddings.transformersJS,
])

// Type inference helpers
export type SupportedLLMModel = z.infer<typeof ZSupportedLLMModel>
export type SupportedEmbeddingModel = z.infer<typeof ZSupportedEmbeddingModel>
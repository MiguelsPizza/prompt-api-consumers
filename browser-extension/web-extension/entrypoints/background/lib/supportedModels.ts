import { z } from 'zod'

/**
 * List of all supported models organized by type and engine.
 * As we add more models, they should be added to the appropriate section below.
 */

export const supportedMlcModels = [
  "Llama-3.2-1B-Instruct-q4f32_1-MLC",
  "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  "Llama-3.2-1B-Instruct-q0f32-MLC",
  "Llama-3.2-1B-Instruct-q0f16-MLC",
  "Llama-3.2-3B-Instruct-q4f32_1-MLC",
  "Llama-3.2-3B-Instruct-q4f16_1-MLC",
  "Llama-3.1-8B-Instruct-q4f32_1-MLC-1k",
  "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k",
  "Llama-3.1-8B-Instruct-q4f32_1-MLC",
  "Llama-3.1-8B-Instruct-q4f16_1-MLC",
  "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC",
  "DeepSeek-R1-Distill-Qwen-7B-q4f32_1-MLC",
  "DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC",
  "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC",
  "Hermes-2-Theta-Llama-3-8B-q4f16_1-MLC",
  "Hermes-2-Theta-Llama-3-8B-q4f32_1-MLC",
  "Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC",
  "Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC",
  "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
  "Hermes-3-Llama-3.2-3B-q4f16_1-MLC",
  "Hermes-3-Llama-3.1-8B-q4f32_1-MLC",
  "Hermes-3-Llama-3.1-8B-q4f16_1-MLC",
  "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC",
  "Phi-3.5-mini-instruct-q4f16_1-MLC",
  "Phi-3.5-mini-instruct-q4f32_1-MLC",
  "Phi-3.5-mini-instruct-q4f16_1-MLC-1k",
  "Phi-3.5-mini-instruct-q4f32_1-MLC-1k",
  "Phi-3.5-vision-instruct-q4f16_1-MLC",
  "Phi-3.5-vision-instruct-q4f32_1-MLC",
  "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
  "Mistral-7B-Instruct-v0.3-q4f32_1-MLC",
  "Mistral-7B-Instruct-v0.2-q4f16_1-MLC",
  "OpenHermes-2.5-Mistral-7B-q4f16_1-MLC",
  "NeuralHermes-2.5-Mistral-7B-q4f16_1-MLC",
  "WizardMath-7B-V1.1-q4f16_1-MLC",
  "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
  "SmolLM2-1.7B-Instruct-q4f32_1-MLC",
  "SmolLM2-360M-Instruct-q0f16-MLC",
  "SmolLM2-360M-Instruct-q0f32-MLC",
  "SmolLM2-360M-Instruct-q4f16_1-MLC",
  "SmolLM2-360M-Instruct-q4f32_1-MLC",
  "SmolLM2-135M-Instruct-q0f16-MLC",
  "SmolLM2-135M-Instruct-q0f32-MLC",
  "gemma-2-2b-it-q4f16_1-MLC",
  "gemma-2-2b-it-q4f32_1-MLC",
  "gemma-2-2b-it-q4f16_1-MLC-1k",
  "gemma-2-2b-it-q4f32_1-MLC-1k",
  "gemma-2-9b-it-q4f16_1-MLC",
  "gemma-2-9b-it-q4f32_1-MLC",
  "gemma-2-2b-jpn-it-q4f16_1-MLC",
  "gemma-2-2b-jpn-it-q4f32_1-MLC",
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
  "Qwen2.5-0.5B-Instruct-q0f16-MLC",
  "Qwen2.5-0.5B-Instruct-q0f32-MLC",
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
  "Qwen2.5-3B-Instruct-q4f16_1-MLC",
  "Qwen2.5-3B-Instruct-q4f32_1-MLC",
  "Qwen2.5-7B-Instruct-q4f16_1-MLC",
  "Qwen2.5-7B-Instruct-q4f32_1-MLC",
  "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC",
  "Qwen2.5-Coder-0.5B-Instruct-q0f16-MLC",
  "Qwen2.5-Coder-0.5B-Instruct-q0f32-MLC",
  "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC",
  "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC",
  "Qwen2.5-Coder-3B-Instruct-q4f32_1-MLC",
  "Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC",
  "Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC",
  "Qwen2.5-Math-1.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-Math-1.5B-Instruct-q4f32_1-MLC",
  "stablelm-2-zephyr-1_6b-q4f16_1-MLC",
  "stablelm-2-zephyr-1_6b-q4f32_1-MLC",
  "stablelm-2-zephyr-1_6b-q4f16_1-MLC-1k",
  "stablelm-2-zephyr-1_6b-q4f32_1-MLC-1k",
  "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC",
  "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC",
  "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC-1k",
  "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC-1k",
  "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
  "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC",
  "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k",
  "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC-1k",
  "Llama-3.1-70B-Instruct-q3f16_1-MLC",
  "Qwen2-0.5B-Instruct-q4f16_1-MLC",
  "Qwen2-0.5B-Instruct-q0f16-MLC",
  "Qwen2-0.5B-Instruct-q0f32-MLC",
  "Qwen2-1.5B-Instruct-q4f16_1-MLC",
  "Qwen2-1.5B-Instruct-q4f32_1-MLC",
  "Qwen2-7B-Instruct-q4f16_1-MLC",
  "Qwen2-7B-Instruct-q4f32_1-MLC",
  "Qwen2-Math-1.5B-Instruct-q4f16_1-MLC",
  "Qwen2-Math-1.5B-Instruct-q4f32_1-MLC",
  "Qwen2-Math-7B-Instruct-q4f16_1-MLC",
  "Qwen2-Math-7B-Instruct-q4f32_1-MLC",
  "Llama-3-8B-Instruct-q4f32_1-MLC-1k",
  "Llama-3-8B-Instruct-q4f16_1-MLC-1k",
  "Llama-3-8B-Instruct-q4f32_1-MLC",
  "Llama-3-8B-Instruct-q4f16_1-MLC",
  "Llama-3-70B-Instruct-q3f16_1-MLC",
  "Phi-3-mini-4k-instruct-q4f16_1-MLC",
  "Phi-3-mini-4k-instruct-q4f32_1-MLC",
  "Phi-3-mini-4k-instruct-q4f16_1-MLC-1k",
  "Phi-3-mini-4k-instruct-q4f32_1-MLC-1k",
  "Llama-2-7b-chat-hf-q4f32_1-MLC-1k",
  "Llama-2-7b-chat-hf-q4f16_1-MLC-1k",
  "Llama-2-7b-chat-hf-q4f32_1-MLC",
  "Llama-2-7b-chat-hf-q4f16_1-MLC",
  "Llama-2-13b-chat-hf-q4f16_1-MLC",
  "gemma-2b-it-q4f16_1-MLC",
  "gemma-2b-it-q4f32_1-MLC",
  "gemma-2b-it-q4f16_1-MLC-1k",
  "gemma-2b-it-q4f32_1-MLC-1k",
  "phi-2-q4f16_1-MLC",
  "phi-2-q4f32_1-MLC",
  "phi-2-q4f16_1-MLC-1k",
  "phi-2-q4f32_1-MLC-1k",
  "phi-1_5-q4f16_1-MLC",
  "phi-1_5-q4f32_1-MLC",
  "phi-1_5-q4f16_1-MLC-1k",
  "phi-1_5-q4f32_1-MLC-1k",
  "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC",
  "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC",
  "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC-1k",
  "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k",
  "snowflake-arctic-embed-m-q0f32-MLC-b32",
  "snowflake-arctic-embed-m-q0f32-MLC-b4",
  "snowflake-arctic-embed-s-q0f32-MLC-b32",
  "snowflake-arctic-embed-s-q0f32-MLC-b4"
] as const
// Language Models (LLMs)
const supportedLLMs = {
  // MLC-powered models
  mlc: supportedMlcModels,
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
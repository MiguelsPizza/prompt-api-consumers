import { ChatOptions, MLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import { z } from "zod";
import { modelStore } from "./mlcIndexeddbUtils";
import { SupportedLLMModel, ZSupportedLLMModel } from "./supportedModels";

// Regex to validate Hugging Face model URLs
const huggingFaceModelUrlRegex = /^https:\/\/huggingface\.co\/[^\/]+\/[^\/]+(?:\/resolve\/[^\/]+)?\/?$/;


// Validator for ChatOptions, an empty object with passthrough for now.
// Refine this further if you know what fields ChatOptions should contain.
export const ChatOptionsValidator = z.object({}).passthrough();

// Validator for ModelType.
// Our enum specifies:
//    LLM = 0
//    embedding = 1
//    VLM = 2
export const ModelTypeValidator = z.union([
  z.literal(0), // LLM
  z.literal(1), // embedding
  z.literal(2)  // VLM
]);

export type ModelType = z.infer<typeof ModelTypeValidator>;

// Validator for the ValidatedModelRecord interface.
export const ModelRecordValidator = z.object({
  model: z
    .string()
    .regex(
      huggingFaceModelUrlRegex,
      "Invalid huggingface model URL format. Expected formats: 'https://huggingface.co/{USERNAME}/{MODEL}', 'https://huggingface.co/{USERNAME}/{MODEL}/', 'https://huggingface.co/{USERNAME}/{MODEL}/resolve/{BRANCH}', or 'https://huggingface.co/{USERNAME}/{MODEL}/resolve/{BRANCH}/'."
    ),
  model_id: ZSupportedLLMModel,
  model_lib: z.string(),
  overrides: ChatOptionsValidator.optional(),
  vram_required_MB: z.number().optional(),
  low_resource_required: z.boolean().optional(),
  buffer_size_required_bytes: z.number().optional(),
  required_features: z.array(z.string()).optional(),
  model_type: ModelTypeValidator.optional(),
});

export type ValidatedModelRecord = z.infer<typeof ModelRecordValidator>;

/**
 * Interface representing a single NDArray cache entry.
 */
export interface NDArrayCacheEntry {
  name: string;
  shape: number[];
  dtype: string;
  format: 'f32-to-bf16' | 'raw';
  byteOffset: number;
  nbytes: number;
}

/**
 * Interface representing a shard entry for NDArray caching.
 */
export interface NDArrayShardEntry {
  dataPath: string;
  format: 'raw-shard';
  nbytes: number;
  records: NDArrayCacheEntry[];
}

/**
 * Interface representing the NDArray cache JSON structure.
 */
export interface NDArrayCacheJSON {
  records: NDArrayShardEntry[];
}

/**
 * Interface representing a cached model with its manifest URL and total size.
 */
// export interface CachedModel {
//   /** The URL pointing to the manifest (ndarray-cache.json) for the model. */
//   manifestUrl: string;
//   /** The total size in bytes computed from the manifest's shard entries. */
//   totalSize: number;
// }


/**
 * Initializes and reloads the specified model within the MLCEngine.
 *
 * This asynchronous function performs the following steps:
 *
 * 1. Retrieves the model-specific store using the provided model identifier.
 * 2. Searches for the corresponding model configuration within the prebuilt application
 *    configuration.
 * 3. Validates the model configuration using the ModelRecordValidator.
 * 4. Stores the validated model configuration in the model store.
 * 5. Reloads the MLCEngine with the validated model configuration and optional chat options.
 *
 * @async
 * @param {MLCEngine} modelEngine - The engine instance responsible for managing model operations.
 * @param {SupportedLLMModel} modelId - The unique identifier of the model to be initialized.
 * @param {ChatOptions | ChatOptions[]} [chatOpts] - Optional chat configuration options.
 *
 * @throws {Error} If no model configuration matching the `modelId` is found.
 * @throws ValidationError from Zod if the configuration fails validation.
 *
 */
export async function initModel(
  modelEngine: MLCEngine,
  modelId: SupportedLLMModel,
  chatOpts?: ChatOptions | ChatOptions[]
) {
  // Retrieve the dedicated model store for this model.

  // Locate the model configuration within the prebuilt application config.
  const modelMatch = prebuiltAppConfig.model_list.find(
    (model) => model.model_id === modelId
  );

  // Ensure that a matching configuration exists.
  if (!modelMatch) {
    throw new Error(`Model with id ${modelId} was not found in the configuration list.`);
  }

  // Validate the located model configuration asynchronously.
  const validatedModelMatch = await ModelRecordValidator.parseAsync(modelMatch);
  const curr = await modelStore.getValue()
  // Store the validated model configuration.
  await modelStore.setValue({ ...curr, [validatedModelMatch.model_id]: validatedModelMatch });

  // Reload the model engine with the updated configuration and optional chat options.
  await modelEngine.reload(modelId, chatOpts);
  return modelStore
}
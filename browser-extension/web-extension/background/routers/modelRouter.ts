// modelRouter.ts
import { deleteModelAllInfoInCache, hasModelInCache, prebuiltAppConfig } from '@mlc-ai/web-llm';
import { z } from 'zod';
import { CachedModel, listCachedModels } from '../lib/modelUtils';
import { t } from './trpcBase';

// Import Dexie-based helpers from our WebLLM IndexedDB utility module.


/**
 * modelRouter:
 * A TRPC router that provides procedures to list cached models (and their sizes),
 * live-subscribe to changes in the model cache, check for the existence of a model,
 * and delete a model (removing all its associated cache entries).
 */
export const modelRouter = t.router({
  /**
   * List all cached models.
   *
   * This query scans the Dexie database (opened with the scope "webllm/model")
   * for manifest entries (i.e. URLs ending with "ndarray-cache.json"). For each manifest,
   * it computes the total model size by summing the `nbytes` fields from its shard entries.
   *
   * @returns {Promise<CachedModel[]>} An array of cached model objects.
   */
  listModels: t.procedure.query(async (): Promise<CachedModel[]> => {
    const models = await listCachedModels();
    return models;
  }),

  /**
   * Download and load a model into the chat engine.
   *
   * This procedure attempts to download and initialize a model for use with the chat engine.
   * It handles errors gracefully and returns a tuple indicating success/failure.
   *
   * @input { object } - An object containing:
   *   - `modelId` {string} — the unique identifier of the model to download
   * @returns {Promise<[boolean, string | null]>} A tuple where:
   *   - First element is true if successful, false if failed
   *   - Second element is null on success, or error message on failure
   */
  downloadModel: t.procedure
    .input(z.object({ modelId: z.string() }))
    .mutation(async ({ ctx, input }): Promise<[boolean, string | null]> => {
      try {
        console.log(input.modelId)
        const model = prebuiltAppConfig.model_list.find(model => model.model_id === input.modelId)
        if (!model) {
          throw new Error(`Model ${input.modelId} not in list`)
        }
        await ctx.chatEngine.reload(model.model_id, { temperature: 0.7 });
        return [true, null];
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Failed to download model ${input.modelId}:`, errorMessage);
        return [false, errorMessage];
      }
    }),

  /**
   * Delete a model from the cache.
   *
   * Given a model identifier, this procedure removes all cached information for the model,
   * including NDArray data, tokenizer files, WASM files, and chat configuration.
   *
   * @input { object } - An object containing:
   *   - `modelId` {string} — the unique identifier of the model.
   * @returns {Promise<object>} An object indicating success and echoing the modelId.
   * @throws Will throw an error if the deletion fails.
   */
  deleteModel: t.procedure
    .input(z.object({ modelId: z.string() }))
    .mutation(async ({ input }) => {
      await deleteModelAllInfoInCache(input.modelId);
      return { success: true, modelId: input.modelId };
    }),

  /**
   * Check if a model is cached.
   *
   * Given a model identifier, this procedure returns a boolean indicating whether the model
   * is present in the cache.
   *
   * @input { object } - An object containing:
   *   - `modelId` {string} — the unique identifier of the model.
   * @returns {Promise<object>} An object with property `isCached` set to true or false.
   */
  hasModel: t.procedure
    .input(z.object({ modelId: z.string() }))
    .query(async ({ input }) => {
      const isCached = await hasModelInCache(input.modelId);
      return { isCached };
    }),
});
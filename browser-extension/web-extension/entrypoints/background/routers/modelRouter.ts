// modelRouter.ts
import { deleteModelAllInfoInCache, hasModelInCache, prebuiltAppConfig } from '@mlc-ai/web-llm';
import { z } from 'zod';
import { initModel } from '../lib/modelUtils';
import { t } from './trpcBase';

// Import the WXT storage API.
import { storage } from 'wxt/storage';
// Import observable helper for subscriptions.
import { observable } from '@trpc/server/observable';
import { ExtensionModelStore, modelStore } from '../lib/mlcIndexeddbUtils';
import { SupportedLLMModel, ZSupportedLLMModel } from '../lib/supportedModels';

/**
 * modelRouter:
 * A TRPC router that provides procedures to list cached models (and their sizes),
 * live-subscribe to changes in the model cache, check for the existence of a model,
 * delete a model, subscribe to changes in the current model in WXT storage, and change the model.
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
  listModels: t.procedure.subscription(() => {
    return observable<ExtensionModelStore>((emit) => {
      // Immediately fetch and emit the initial state
      modelStore.getValue().then(initialModels => {
        emit.next(initialModels);
      });

      // Set up subscription for future updates
      const unwatch = modelStore.watch((updatedStore) => {
        emit.next(updatedStore);
      });

      // Return cleanup function
      return () => {
        unwatch();
      };
    });
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
    .input(z.object({ modelId: ZSupportedLLMModel }))
    .mutation(async ({ ctx, input }): Promise<[boolean, string | null]> => {
      try {
        console.log(input.modelId)
        const model = prebuiltAppConfig.model_list.find(model => model.model_id === input.modelId)
        if (!model) {
          throw new Error(`Model ${input.modelId} not in list`)
        }
        await initModel(ctx.chatEngine, input.modelId, { temperature: 0.7 });
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
    .input(ZSupportedLLMModel)
    .query(async ({ input }) => {
      const isCached = await hasModelInCache(input);
      return { isCached };
    }),

  /**
   * Live procedure (subscription) that watches for changes in WXT storage
   * for the current model.
   *
   * Uses the "local:currentModel" key in WXT storage. When the value changes,
   * the new value is emitted to subscribers.
   */
  liveCurrentModel: t.procedure.subscription(() => {
    return observable<SupportedLLMModel | null>((emit) => {
      // Emit the current model immediately (if it exists).
      storage
        .getItem<SupportedLLMModel>('sync:currentModel')
        .then((currentModel) => {
          if (currentModel !== null && currentModel !== undefined) {
            emit.next(currentModel);
          }
        })
        .catch((err) => {
          console.error('Error fetching current model:', err);
        });

      // Set up a watcher for changes in the "local:currentModel" key.
      const unwatch = storage.watch<SupportedLLMModel>('sync:currentModel', (newModel) => {
        emit.next(newModel);
      });

      // Return the cleanup function that removes the watcher.
      return () => {
        unwatch();
      };
    });
  }),

  /**
   * Post procedure (mutation) that changes the current model by updating the WXT storage.
   *
   * The input is validated using Zod. Here, we first ensure that the model exists in
   * our prebuilt application config and then update the "local:currentModel" storage key.
   */
  setCurrentModel: t.procedure
    .input(ZSupportedLLMModel)
    .mutation(async ({ input: modelId }) => {
      // Ensure that the provided modelId is in the prebuilt list.
      const model = prebuiltAppConfig.model_list.find(
        (model) => model.model_id === modelId
      );
      if (!model) {
        throw new Error(`Model ${modelId} not found in prebuilt app config`);
      }

      // Set the current model in WXT storage.
      await storage.setItem('sync:currentModel', modelId);

      return { success: true, modelId: modelId };
    }),
});
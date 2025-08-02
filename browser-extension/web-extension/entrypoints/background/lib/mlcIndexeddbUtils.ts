import { storage } from 'wxt/storage';
import { ValidatedModelRecord } from './modelUtils';
import { SupportedLLMModel } from './supportedModels';

/**
 * Type-safe names for WebLLM caches.
 */
export type WebLLMDBName = 'webllm/model' | 'webllm/config' | 'webllm/wasm';

export type ExtensionModelStore = Partial<Record<SupportedLLMModel, ValidatedModelRecord>>

/**
 * Extension storage location for model metadata.
 * Stores information like download status and version info for each supported model.
 */
export const modelStore = storage.defineItem<ExtensionModelStore>(`local:models`, {
  fallback: { chromeAI: { model_id: "chromeAI", vram_required_MB: 20, model: "chromeAI", model_lib: 'N/A' } }
})


// /**
//  * Interface representing an entry in the cache.
//  */
// export interface UrlCacheEntry {
//   /** The full URL used as the primary key. */
//   url: string;
//   /**
//    * The cached data.
//    * For manifest files this is typically a parsed JSON object,
//    * whereas for other files it might be an ArrayBuffer.
//    */
//   data: unknown;
// }


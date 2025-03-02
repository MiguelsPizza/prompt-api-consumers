import { storage } from 'wxt/storage';
import { ValidatedModelRecord } from './modelUtils';
import { SupportedLLMModel } from './supportedModels';

/**
 * Type-safe names for WebLLM caches.
 */
export type WebLLMDBName = 'webllm/model' | 'webllm/config' | 'webllm/wasm';

export type ExtensionModelStore = Partial<Record<`local:${SupportedLLMModel}`, ValidatedModelRecord>>

/**
 * Extension storage location for model metadata.
 * Stores information like download status and version info for each supported model.
 */
export const makeModelStore = (modelId: SupportedLLMModel) => storage.defineItem<ValidatedModelRecord>(`local:${modelId}`)


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


import { ArtifactDBListener } from './mlcIndexeddbUtils';
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
export interface CachedModel {
  /** The URL pointing to the manifest (ndarray-cache.json) for the model. */
  manifestUrl: string;
  /** The total size in bytes computed from the manifest’s shard entries. */
  totalSize: number;
}

/**
 * Lists cached models stored in the "webllm/model" cache.
 *
 * This function scans the underlying IndexedDB store for entries whose URL ends with "ndarray-cache.json".
 * It then parses each manifest (assumed to conform to NDArrayCacheJSON) and computes the total space
 * used by summing the `nbytes` fields from each shard.
 *
 * @returns A promise that resolves to an array of CachedModel objects.
 */
export async function listCachedModels(): Promise<CachedModel[]> {
  const db = new ArtifactDBListener('webllm/model');
  await db.init()
  const entries = await db.fetchAllEntries()

  const models: CachedModel[] = [];

  // Look for manifest files (ndarray-cache.json)
  for (const entry of entries) {
    if (
      entry.url.endsWith('ndarray-cache.json') &&
      entry.data &&
      typeof entry.data === 'object'
    ) {
      const manifest = entry.data as NDArrayCacheJSON;
      let totalSize = 0;
      if (Array.isArray(manifest.records)) {
        for (const shard of manifest.records) {
          totalSize += shard.nbytes;
        }
      }
      models.push({ manifestUrl: entry.url, totalSize });
    }
  }
  return models;
}
import { DBSchema, IDBPDatabase, openDB } from 'idb';

/**
 * Type-safe names for WebLLM caches.
 */
export type WebLLMDBName = 'webllm/model' | 'webllm/config' | 'webllm/wasm';

/**
 * Interface representing an entry in the cache.
 */
export interface UrlCacheEntry {
  /** The full URL used as the primary key in the IndexedDB store. */
  url: string;
  /**
   * The cached data.
   * For manifest files this is typically a parsed JSON object,
   * whereas for other files it might be an ArrayBuffer.
   */
  data: unknown;
}

/**
 * Define a DBSchema for the artifact DB.
 */
interface ArtifactDBSchema extends DBSchema {
  urls: {
    key: string;
    value: UrlCacheEntry;
    // You can add indexes if needed:
    // indexes: { 'by-someField': string };
  };
}

type ChangeCallback = (changes: {
  added: UrlCacheEntry[];
  updated: UrlCacheEntry[];
  removed: string[];
}) => void;

/**
 * Utility class that opens the externally created IndexedDB database
 * and polls for changes in the "urls" object store.
 */
export class ArtifactDBListener {
  private db?: IDBPDatabase<ArtifactDBSchema>;
  private pollTimer?: number;
  private lastData: Map<string, UrlCacheEntry> = new Map();

  /**
   * @param dbName - The name of the IndexedDB database (one of the WebLLMDBName values).
   * @param pollingInterval - How often (in milliseconds) to poll for changes. Default is 1000ms.
   */
  constructor(
    private readonly dbName: WebLLMDBName,
    private readonly pollingInterval: number = 1000
  ) {
  }

  /**
   * Opens the database. (If the store doesn’t exist, it will create it,
   * but in your case the external library should have already set it up.)
   */
  async init(poll: boolean = false): Promise<void> {
    // Open the database with version 1 (adjust if needed)
    this.db = await openDB<ArtifactDBSchema>(this.dbName, 1, {
      upgrade(db) {
        // If the external library hasn't created the store, create it.
        // Otherwise, this is a no-op.
        if (!db.objectStoreNames.contains('urls')) {
          db.createObjectStore('urls', { keyPath: 'url' });
        }
      },
    });

    // Create an initial snapshot of the data.
    await this.updateLastDataSnapshot();

    // Start polling for changes.
    if (poll) {
      this.startPolling();
    }
  }

  /**
   * Retrieves all entries from the "urls" object store.
   */
  async fetchAllEntries(): Promise<UrlCacheEntry[]> {
    if (!this.db) {
      throw new Error('Database is not initialized');
    }
    return await this.db.getAll('urls');
  }

  /**
   * Compares the current data with the last known snapshot.
   * If there are any changes, calls the registered change callback.
   */
  private async checkForChanges(): Promise<void> {
    if (!this.db) return;

    const currentEntries = await this.fetchAllEntries();
    const currentData = new Map<string, UrlCacheEntry>();
    for (const entry of currentEntries) {
      currentData.set(entry.url, entry);
    }

    const added: UrlCacheEntry[] = [];
    const updated: UrlCacheEntry[] = [];
    const removed: string[] = [];

    // Determine added or updated entries.
    for (const [url, entry] of currentData) {
      if (!this.lastData.has(url)) {
        added.push(entry);
      } else {
        // A simple comparison; customize if needed for deep equality.
        const oldEntry = this.lastData.get(url)!;
        if (JSON.stringify(oldEntry) !== JSON.stringify(entry)) {
          updated.push(entry);
        }
      }
    }

    // Determine removed entries.
    for (const [url] of this.lastData) {
      if (!currentData.has(url)) {
        removed.push(url);
      }
    }

    // If changes were detected, call the callback and update the snapshot.
    if (added.length || updated.length || removed.length) {
      this.changeCallback?.({ added, updated, removed });
      this.lastData = currentData;
    }
  }

  /**
   * Starts a polling interval to check for database changes.
   */
  private startPolling(): void {
    this.pollTimer = setInterval(() => {
      this.checkForChanges().catch(console.error);
    }, this.pollingInterval) as unknown as number
  }

  /**
   * Stops the polling.
   */
  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  /**
   * Updates the snapshot of the last known data.
   */
  private async updateLastDataSnapshot(): Promise<void> {
    const entries = await this.fetchAllEntries();
    this.lastData.clear();
    for (const entry of entries) {
      this.lastData.set(entry.url, entry);
    }
  }

  /**
   * Callback type to notify about detected changes.
   */


  private changeCallback?: ChangeCallback;

  /**
   * Registers a callback to be invoked when changes are detected.
   *
   * @param callback - A function that receives an object with arrays for added, updated, and removed entries.
   */
  onChange(callback: ChangeCallback): void {
    this.changeCallback = callback;
  }
}
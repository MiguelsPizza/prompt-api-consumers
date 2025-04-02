import EventEmitter from "emittery";
import { UUID } from 'crypto'; // Import UUID type

/**
 * Defines the types of events that can be emitted by the global event emitter.
 */
export interface EEeventTypes {
    /**
     * Emitted when the model download status changes.
     * `true` indicates downloading is in progress, `false` indicates it's finished or idle.
     */
    downloading: boolean;
    /**
     * Emitted to signal the destruction or cleanup related to a specific UUID.
     * The payload is the UUID identifying the resource to be destroyed.
     */
    destroy: UUID;
}

/**
 * Global event emitter instance for background script communication.
 * Used for broadcasting events like model download status changes.
 * Debugging is enabled for easier tracing.
 */
export const ee = new EventEmitter<EEeventTypes>({ debug: { name: 'backgroundEE', enabled: true } }); // Renamed debug name for clarity
/**
 * AttachPolyfillOptions
 * ---------------------
 * Options for controlling provider lifecycle when attaching to window.ai
 */
export interface AttachPolyfillOptions {
  /**
   * Called when this provider is mounted as the active window.ai implementation.
   * The client library can perform any necessary setup or initialization.
   */
  onProviderSelect(): void;

  /**
   * Called when this provider is dismounted as the active window.ai implementation.
   * The client library can perform any necessary cleanup.
   */
  onProviderDeselect(): void;
}
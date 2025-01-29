import type { AIPolyfillWithMetaData } from "./createWebAIPolyfill";

/**
 * attachAIObjectToWindow
 * ----------------------
 * Applies a given AI object to the global environment
 * (e.g., window.ai), calling provider lifecycle hooks.
 */
export function attachAIObjectToWindow(aiObject: AIPolyfillWithMetaData): void {
  // If multiple AI providers try to attach themselves, you could
  // add conflict-resolution logic here.

  Object.defineProperty(window, "ai", {
    value: aiObject,
    writable: false,
    enumerable: true,
    configurable: true,
  });

  // run the setup scripts
  aiObject._meta.options.onProviderSelect();
}
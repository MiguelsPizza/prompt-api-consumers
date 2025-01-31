/**
 * @file createWindowProxy.ts
 * Pass-through proxy for relaying window.postMessage <-> chrome.runtime.Port,
 * now updated to leverage the WindowRequest / WindowResponse types from src/types.
 */
import type { WindowRequest, WindowResponse } from './types';

/**
 * Configuration options for createWindowProxy
 */
export interface WindowProxyConfig {
  /**
   * If true, log debug messages whenever events are forwarded.
   * Defaults to false.
   */
  debug?: boolean;

  /**
   * If true, only accept messages from window with the same origin as the current page.
   * Defaults to true. Adjust to your security needs.
   */
  enforceSameOrigin?: boolean;
}

/**
 * Creates a pass-through proxy between the main page (via window.postMessage)
 * and the background script (via a chrome.runtime.Port).
 *
 * Typical usage:
 * ```ts
 * // content-script.ts
 * import { createWindowProxy } from "./createWindowProxy"
 *
 * const port = chrome.runtime.connect()
 * const cleanup = createWindowProxy(port, {
 *   debug: true,
 *   enforceSameOrigin: true,
 * })
 * ```
 *
 * @param port - The chrome.runtime.Port to communicate with the background script.
 * @param config - Optional configuration for debugging, security checks, and metrics.
 * @returns A cleanup function to remove all listeners and disconnect the port.
 */
export function createWindowProxy(
  port: chrome.runtime.Port,
  config: WindowProxyConfig = {},
): () => void {
  const { debug = false, enforceSameOrigin = true } = config;

  // Track the IDs of requests we've forwarded. Once we see a matching response,
  // we remove it from here to prevent duplicates or infinite loops.
  const inFlightIds = new Set<string | number>();

  /**
   * Handle messages from window → forward them to background
   */
  function handleWindowMessage(evt: MessageEvent<WindowRequest | WindowResponse>) {
    // 1) Security check: ensure same origin if desired
    if (enforceSameOrigin && evt.origin !== window.location.origin) {
      if (debug) {
        console.warn(
          `%c[Relay] Rejected message from different origin: ${evt.origin}`,
          'color: orange;',
        );
      }
      return;
    }

    const msg = evt.data?.trpc;
    if (!msg) return;

    // @ts-expect-error could be anything here
    const { id, method, result, error } = msg;

    // 3) Distinguish between requests (with a .method) and responses (.result / .error)
    const isRequest = !!method;
    const isResponse = !method && (result !== undefined || error !== undefined);

    if (isRequest) {
      // Confirm it has a valid ID, then track it
      if (id != null) {
        inFlightIds.add(id);
      }

      if (debug) {
        console.debug(
          `%c[Window → BGSW] Forwarding request. ID: ${id}, method: ${method}`,
          'color: teal;',
        );
      }

      // Attach a marker to avoid re-processing in handlePortMessage
      port.postMessage({ trpc: msg });
      return;
    }

    if (isResponse) {
      // If we get a "response" from window that doesn't match an in-flight ID, ignore it
      if (id != null && !inFlightIds.has(id)) {
        if (debug) {
          console.debug(
            `%c[Relay] Ignoring response ${id} because request is not in flight.`,
            'color: #999;',
          );
        }
        return;
      }

      // If you do want to forward responses back to background, do it here.
      // Or you might just ignore them if they're truly only for the page UI.
      // e.g. port.postMessage({ trpc: { ...msg} });
      // Then remove it from the set to avoid duplicates
      if (id != null) {
        inFlightIds.delete(id);
      }
      return;
    }

    // Otherwise it's some unknown shape: skip it
    if (debug) {
      console.debug('[Relay] Unknown message shape, ignoring.', msg);
    }
  }

  /**
   * Handle messages from background → forward them to window
   */
  function handlePortMessage(msg: WindowResponse) {
    if (!msg?.trpc) return;
    const { id, result, error } = msg.trpc;

    // If this is a response to a known in-flight request, remove from the set
    if (id !== undefined && inFlightIds.has(id)) {
      inFlightIds.delete(id);
    }

    if (debug) {
      console.debug(
        `%c[BGSW → Window] Sending response for ID: ${id}`,
        'color: purple;',
        'result:',
        result,
        'error:',
        error,
      );
    }

    window.postMessage(msg, '*');
  }

  /**
   * Handle port disconnection
   */
  function handlePortDisconnect() {
    if (debug) {
      console.warn('%c[Relay] Port disconnected, cleaning up listeners.', 'color: red;');
    }
    cleanup();
  }

  /**
   * Cleanup function
   */
  function cleanup() {
    window.removeEventListener('message', handleWindowMessage as EventListener);
    port.onMessage.removeListener(handlePortMessage as (m: unknown) => void);
    port.onDisconnect.removeListener(handlePortDisconnect);
    port.disconnect();
  }

  // Wire up listeners
  window.addEventListener('message', handleWindowMessage as EventListener);
  port.onMessage.addListener(handlePortMessage as (m: unknown) => void);
  port.onDisconnect.addListener(handlePortDisconnect);

  return cleanup;
}

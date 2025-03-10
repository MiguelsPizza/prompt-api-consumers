/**
 * Content Script Entry Point
 * 
 * This script serves as the main entry point for the extension's content script.
 * It handles:
 * 1. Setting up communication with the background service worker
 * 2. Injecting custom UI elements and required scripts
 * 3. Error handling and cleanup
 */
import { defineContentScript } from 'wxt/sandbox';
import { createWindowProxy } from '@/chromeTrpcAdditions/windowToBGSWProxy';

// Define all injectable scripts
const INJECTABLE_SCRIPTS = {
  customElements: [
    {
      path: '/injectDownloadTracker.js',
      name: 'Download Tracker',
      required: true
    }
  ],
  polyfills: [
    {
      path: '/injectPolyfill.js',
      name: 'Core Polyfills',
      required: true
    }
  ]
} as const;

export default defineContentScript({
  matches: ['<all_urls>'],
  async main(ctx) {
    let removeProxy: (() => void) | undefined;

    let button = document.createElement('button');
    button.textContent = "test";
    button.addEventListener('click', e => {
      chrome.runtime.sendMessage('open');
    });
    document.body.appendChild(button);

    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.sidePanel.setOptions({
        tabId: currentTab.id,
        path: 'sidepanel.html',
        enabled: true
      });
      // 1. Initialize communication with background service worker
      const port = chrome.runtime.connect({ name: "web_llm_service_worker" });
      removeProxy = createWindowProxy(port, {
        debug: true,
        enforceSameOrigin: false
      });

      // 2. Inject custom elements
      const elementResults = await Promise.allSettled(
        INJECTABLE_SCRIPTS.customElements.map(async (script) => {
          try {
            await injectScript(script.path, { keepInDom: true });
            return { name: script.name, success: true };
          } catch (error) {
            if (script.required) {
              throw new Error(`Failed to inject required element: ${script.name}`);
            }
            console.warn(`[Content] Non-critical element failed to load: ${script.name}`, error);
            return { name: script.name, success: false, error };
          }
        })
      );

      // Log results of custom element injection
      elementResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { name, success } = result.value;
          if (success) {
            console.log(`[Content] Successfully injected: ${name}`);
          }
        } else {
          console.error(`[Content] Failed to inject element:`, result.reason);
        }
      });

      // 3. Inject polyfills and core scripts
      const polyfillResults = await Promise.allSettled(
        INJECTABLE_SCRIPTS.polyfills.map(async (script) => {
          try {
            await injectScript(script.path, { keepInDom: true });
            return { name: script.name, success: true };
          } catch (error) {
            if (script.required) {
              throw new Error(`Failed to inject required polyfill: ${script.name}`);
            }
            console.warn(`[Content] Non-critical polyfill failed to load: ${script.name}`, error);
            return { name: script.name, success: false, error };
          }
        })
      );

      // Log results of polyfill injection
      polyfillResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { name, success } = result.value;
          if (success) {
            console.log(`[Content] Successfully injected: ${name}`);
          }
        } else {
          console.error(`[Content] Failed to inject polyfill:`, result.reason);
        }
      });

      // Check if any required scripts failed
      const requiredFailed = [...elementResults, ...polyfillResults].some(
        (result) => result.status === 'rejected'
      );

      if (requiredFailed) {
        throw new Error('One or more required scripts failed to load');
      }

    } catch (error) {
      console.error('[Content] Critical error in content script:', error);

      // Clean up proxy connection if it was established
      if (removeProxy) {
        try {
          removeProxy();
        } catch (cleanupError) {
          console.error('[Content] Error during cleanup:', cleanupError);
        }
      }

      // Re-throw error to indicate failure
      throw error;
    }

    // Return cleanup function
    return () => {
      if (removeProxy) {
        removeProxy();
      }
    };
  },
});
// content-script.ts
// content-script.ts
import { defineContentScript } from 'wxt/sandbox';

import { createWindowProxy } from '../../../src/link/windowToBGSWProxy';

// create the main→content "server" that proxies to background
// this is the current api
export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('[Content] Setting up content script...');
    const port = chrome.runtime.connect({ name: "web_llm_service_worker" });
    const removeProxy = createWindowProxy(port, {
      debug: true,
      enforceSameOrigin: false
    });
    console.log('[Content] Created window proxy');

    try {
      console.log('[Content] Injecting main world script...');
      await injectScript('/example-main-world.js', {
        keepInDom: true,
      });
      console.log('[Content] Successfully injected main world script');
    } catch (error) {
      console.error('[Content] Failed to inject script:', error);
      removeProxy();
      throw error;
    }
  },
});

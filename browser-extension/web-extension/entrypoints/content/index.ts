// content-script.ts
// content-script.ts
import { defineContentScript } from 'wxt/sandbox';

import { createWindowProxy } from '@/chromeTrpcAdditions/windowToBGSWProxy';

// create the main→content "server" that proxies to background
// this is the current api
export default defineContentScript({
  matches: ['<all_urls>'],
  async main(ctx) {
    const port = chrome.runtime.connect({ name: "web_llm_service_worker" });
    const removeProxy = createWindowProxy(port, {
      debug: true,
      enforceSameOrigin: false
    });
    try {
      // First inject the download tracker custom element
      await injectScript('/injectDownloadTracker.js', {
        keepInDom: true,
      });
      console.log('[Content] Successfully injected download tracker');

      // Then inject the main world script
      await injectScript('/injectPolyfill.js', {
        keepInDom: true,
      });
    } catch (error) {
      console.error('[Content] Failed to inject script:', error);
      removeProxy();
      throw error;
    }
  },
});

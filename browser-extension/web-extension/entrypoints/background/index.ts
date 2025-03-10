/* eslint-disable @typescript-eslint/no-unsafe-call */


import { createChromeHandler } from "@/chromeTrpcAdditions/trpc-browser/adapter";
import { appRouter } from "./routers";
import { createContext } from "./routers/routerContext";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-return */

export default defineBackground({
  persistent: true,
  type: "module",
  main() {

    chrome.runtime.onMessage.addListener(message => {
      // open a global side panel
      chrome.windows.getCurrent(window => chrome.sidePanel.open({ windowId: window.id }))
    });

    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => {
        console.error('[Background] Failed to set side panel behavior:', error);
      });

    // Initialize TRPC handler
    createChromeHandler({
      router: appRouter,
      onError: (err: unknown) => {
        console.error('[Background/ChromeHandler] Error occurred:', {
          error: err,
          location: 'background.ts:createChromeHandler'
        });
      },
      createContext,
    });
  }
});

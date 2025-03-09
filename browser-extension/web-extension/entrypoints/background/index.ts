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

    chrome.runtime.onInstalled.addListener(() => {
      chrome.contextMenus.create({
        id: 'openSidePanel',
        title: 'Open side panel',
        contexts: ['all']
      });
    });
    // Set up the side panel to open when the action icon is clicked
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

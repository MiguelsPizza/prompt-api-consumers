/* eslint-disable @typescript-eslint/no-unsafe-call */

import { appRouter } from "@/background/routers";
import { createContext } from "@/background/routers/routerContext";
import { createChromeHandler } from "@/chromeTrpcAdditions/trpc-browser/adapter";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-return */

export default defineBackground({
  persistent: true,
  type: "module",
  main() {
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
    console.log('[Background] Chrome handler setup complete');
    const PING_INTERVAL = 25000; // 25 seconds
    setInterval(() => {
      chrome.runtime.getPlatformInfo(() => {
        console.debug('[Background] Keeping service worker alive');
      });
    }, PING_INTERVAL);
  }
});
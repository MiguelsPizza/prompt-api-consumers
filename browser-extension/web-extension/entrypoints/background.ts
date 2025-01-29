/* eslint-disable @typescript-eslint/no-unsafe-call */

import { appRouter } from "@/background/routers";
import { createContext } from "@/background/routers/routerContext";
import { createChromeHandler } from "../../../src/adapter";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-return */

console.log('[Background] Creating event emitter...');




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
  }
});
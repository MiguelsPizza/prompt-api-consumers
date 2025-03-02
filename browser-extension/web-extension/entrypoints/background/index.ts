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

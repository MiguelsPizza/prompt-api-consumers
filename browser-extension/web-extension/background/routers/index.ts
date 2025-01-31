import { mlcRouter } from "./mlcRouter";
import { t } from "./trpcBase";

export const appRouter = t.router({
  mlc: mlcRouter,
  // test: testRouter
});

export type AppRouter = typeof appRouter
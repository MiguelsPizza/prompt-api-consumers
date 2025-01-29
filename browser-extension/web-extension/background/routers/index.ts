import { mlcRouter } from "./mlcRouter";
import { testRouter } from "./testRouter";
import { t } from "./trpcBase";

export const appRouter = t.router({
  mlc: mlcRouter,
  test: testRouter
});

export type AppRouter = typeof appRouter
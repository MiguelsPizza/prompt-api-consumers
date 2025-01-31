import { languageModelRouter } from "./languageModelRouter";
import { sessionRouter } from "./sessionRouter";
import { t } from "./trpcBase";

export const appRouter = t.router({
  languageModel: languageModelRouter,
  sessions: sessionRouter,
  // test: testRouter
});

export type AppRouter = typeof appRouter
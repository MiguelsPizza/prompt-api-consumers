import { extensionRouter } from "./extensionRouter";
import { languageModelRouter } from "./languageModelRouter";
import { modelRouter } from "./modelRouter";
import { sessionRouter } from "./sessionRouter";
import { t } from "./trpcBase";

export const appRouter = t.router({
  languageModel: languageModelRouter,
  sessions: sessionRouter,
  models: modelRouter,
  extension: extensionRouter
  // test: testRouter
});

export type AppRouter = typeof appRouter
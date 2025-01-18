import * as schema from '@local-first-web-ai-monorepo/schema/cloud';
import { drizzle } from 'drizzle-orm/pglite/driver';
import { createDrizzle } from './src/react.js';

export type GlobalDrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export const {
  useDrizzleLive,
  useDrizzleLiveIncremental,
  useDrizzlePGlite,
  syncShapeToTable,
  useDrizzleTanstackLiveIncremental,
} = createDrizzle({
  casing: 'snake_case',
  schema: schema,
});

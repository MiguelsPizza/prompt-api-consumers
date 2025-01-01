import { drizzle } from 'drizzle-orm/pglite/driver';
import * as schema from '../../../../local-first-chat-api/src/db/schema.js';
import { createDrizzle } from './src/react.js';
// import { createDrizzle } from '@makisuo/pglite-drizzle/react';

export type GlobalDrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export const {
  useDrizzleLive,
  useDrizzleLiveIncremental,
  syncShapeToTable,
  useDrizzlePGlite,
  useDrizzleTanstackLiveIncremental,
} = createDrizzle({
  casing: 'snake_case',
  schema: schema,
});

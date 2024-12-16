import { live } from '@electric-sql/pglite/live';
import { PGliteWorker } from '@electric-sql/pglite/worker';
import PGWorker from './worker.ts?worker';
import { drizzle } from 'drizzle-orm/pglite/driver';
import * as schema from './schema';
import { PGlite } from '@electric-sql/pglite';
import { createDrizzle } from '@makisuo/pglite-drizzle/react';

export const pglite = await new PGliteWorker(new PGWorker({ name: 'pglite-worker' }), { extensions: { live } });

export const db = drizzle(pglite as unknown as PGlite, { schema });

export const { useDrizzleLive, useDrizzleLiveIncremental } = createDrizzle({
  casing: 'snake_case',
  schema: schema,
});

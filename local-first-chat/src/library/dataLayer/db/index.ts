import { live } from '@electric-sql/pglite/live';
import { PGliteWorker } from '@electric-sql/pglite/worker';
import PGWorker from './worker.ts?worker';
import { drizzle } from 'drizzle-orm/pglite/driver';

// Initialize PGlite worker and Kysely
export const pglite = await new PGliteWorker(
  new PGWorker({ name: 'pglite-worker' }),
  { extensions: { live } },
);

//@ts-expect-error should still work with the worker
export const db = drizzle(pglite);

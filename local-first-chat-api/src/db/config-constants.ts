import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

export const SCHEMA_PATH = './src/db/schema.ts';
export const LOCAL_SCHEMA_PATH = './src/db/localSchema.ts';

config({ path: './.dev.vars' });

export const supabaseConfig: Config = {
  schema: SCHEMA_PATH,
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
};

export const pgliteConfig: Config = {
  schema: LOCAL_SCHEMA_PATH,
  out: './drizzle',
  dialect: 'postgresql',
  driver: 'pglite',
  dbCredentials: {
    url: 'idb://chat_database',
  },
};

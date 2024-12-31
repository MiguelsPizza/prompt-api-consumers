import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: './.dev.vars' });

export default [
  // Supabase configuration
  defineConfig({
    schema: './src/db/schema.ts',
    out: './supabase/migrations',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env.DATABASE_URL ?? '',
    },
  }),
  // PGlite configuration
  defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    driver: 'pglite',
    dbCredentials: {
      url: 'idb://chat_database',
    },
  }),
];

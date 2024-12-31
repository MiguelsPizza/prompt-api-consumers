import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { supabaseConfig } from './src/db/config-constants';

config({ path: './.dev.vars' });

export default defineConfig(supabaseConfig);

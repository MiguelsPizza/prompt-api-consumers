// compile-migrations.ts

import { readMigrationFiles } from 'drizzle-orm/migrator';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const migrations = readMigrationFiles({ migrationsFolder: './drizzle/' });

const __dirname = fileURLToPath(new URL('.', import.meta.url));

writeFile(
  join(__dirname, '../local-first-chat/src/library/dataLayer/migrations.json'),
  JSON.stringify(migrations),
  'utf-8',
).then(() => console.log('Migrations compiled!'));

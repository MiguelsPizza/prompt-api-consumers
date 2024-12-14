import { PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';
import { drizzle } from 'drizzle-orm/pglite/driver';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { MigrationConfig } from 'drizzle-orm/migrator';
import migrations from './migrations.json';

worker({
  async init() {
    const pg = new PGlite({
      dataDir: 'idb://chat_database',
      relaxedDurability: true,
    });
    const db = drizzle(pg);
    //@ts-ignore
    db.dialect.migrate(migrations, db.session, {
      migrationsTable: 'drizzle_migrations',
    } satisfies Omit<MigrationConfig, 'migrationsFolder'>);

    return pg;
  },
});

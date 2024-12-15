import { PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';
import { drizzle } from 'drizzle-orm/pglite/driver';
import type { MigrationConfig } from 'drizzle-orm/migrator';
import migrations from './migrations.json';
import { syncShapeToTable } from '@makisuo/pglite-drizzle';
import { OpfsAhpFS } from '@electric-sql/pglite/opfs-ahp';

worker({
  async init() {
    const pg = new PGlite({
      fs: new OpfsAhpFS('chatDB'),
      relaxedDurability: true,
    });
    const db = drizzle(pg);

    //@ts-expect-error internal drizzle type issue
    db.dialect.migrate(migrations, db.session, {
      migrationsTable: 'drizzle_migrations',
    } satisfies Omit<MigrationConfig, 'migrationsFolder'>);

    return pg;
  },
});

import { PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';
import { drizzle } from 'drizzle-orm/pglite/driver';
import type { MigrationConfig } from 'drizzle-orm/migrator';
import * as schema from '../../../../local-first-chat-api/src/db/schema';
import migrations from './migrations.json';
import { IdbFs } from '@electric-sql/pglite';

worker({
  async init() {
    const pg = new PGlite({
      fs: new IdbFs('chatDB'),
      relaxedDurability: true,
    });
    const db = drizzle(pg, { schema, casing: 'snake_case' });

    //@ts-expect-error internal drizzle type issue
    db.dialect.migrate(migrations, db.session, {
      migrationsTable: 'drizzle_migrations',
    } satisfies Omit<MigrationConfig, 'migrationsFolder'>);

    //create a local user to tie chats to. This is an idea to make it so multiple users can use the same device with their own chats
    await db
      .insert(schema.users)
      .values({
        id: 'Local_ID',
        username: 'Local User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .onConflictDoNothing();

    return pg;
  },
});

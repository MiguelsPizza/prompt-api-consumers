import { PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';
import { drizzle, PgliteDatabase } from 'drizzle-orm/pglite/driver';
import type { MigrationConfig } from 'drizzle-orm/migrator';
import * as schema from 'local-first-chat-api/schema';
import { live } from '@electric-sql/pglite/live';

import migrations from './migrations.json';
import { IdbFs } from '@electric-sql/pglite';
import { electricSync } from '@electric-sql/pglite-sync';
import { PgDialect } from 'drizzle-orm/pg-core';
import { setupLocalFirstSchema } from './setUpLocalFirst';

worker({
  async init() {
    const pg = new PGlite({
      fs: new IdbFs('chatDB'),
      relaxedDurability: true,
      extensions: {
        electric: electricSync(),
        live,
      },
    });
    const db = drizzle(pg, { schema, casing: 'snake_case' });

    //@ts-expect-error internal drizzle type issue
    await new PgDialect().migrate(migrations, db._.session, {
      migrationsTable: 'drizzle_migrations',
    } satisfies Omit<MigrationConfig, 'migrationsFolder'>);
    console.log('setting things up');
    await setupLocalFirstSchema(db, ['conversations', 'conversation_messages']);

    let userTemp = await db.query.users.findFirst({
      where({ id }, { eq }) {
        return eq(id, 'local_ID');
      },
    });
    if (!userTemp) {
      [userTemp] = await db
        .insert(schema.users)
        .values({
          id: 'local_ID',
          server_synced: false,
        })
        .returning();
    }
    console.log({ userTemp });
    //prevent double render
    const conversationShape = await pg.electric.syncShapeToTable({
      shape: {
        url: 'https://local-first-chat-electric.fly.dev/v1/shape?offset=-1&table=conversations',
      },
      table: 'conversations',
      primaryKey: ['id'],
    });

    //create a local user to tie chats to. This is an idea to make it so multiple users can use the same device with their own chats
    // await db
    //   .insert(schema.users)
    //   .values({
    //     id: window.crypto.randomUUID(),
    //     username: 'Local User',
    //   })
    //   .onConflictDoNothing();

    return pg;
  },
});

import { PGlite } from '@electric-sql/pglite'
import { worker } from '@electric-sql/pglite/worker'

worker({
  async init() {
    const pg = new PGlite({
      dataDir: 'idb://chat_database',
    });

    await pg.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        name TEXT,
        conversation_summary TEXT,
        system_prompt TEXT,
        created_at TEXT,
        updated_at TEXT,
        top_k REAL,
        temperature REAL,
        user_id TEXT
      )
    `);

    await pg.query(`CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id)`);
    await pg.query(`CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at)`);
    await pg.query(`CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at)`);

    await pg.query(`
      CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        position INTEGER,
        role TEXT,
        content TEXT,
        created_at TEXT,
        updated_at TEXT,
        temperature_at_creation REAL,
        top_k_at_creation REAL,
        user_id TEXT
      )
    `);

    await pg.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON conversation_messages(conversation_id)`);
    await pg.query(`CREATE INDEX IF NOT EXISTS idx_messages_position ON conversation_messages(position)`);
    await pg.query(`CREATE INDEX IF NOT EXISTS idx_messages_conv_position ON conversation_messages(conversation_id, position)`);
    await pg.query(`CREATE INDEX IF NOT EXISTS idx_messages_created ON conversation_messages(created_at)`);
    await pg.query(`CREATE INDEX IF NOT EXISTS idx_messages_user_created ON conversation_messages(user_id, created_at)`);

    return pg;
  }
})
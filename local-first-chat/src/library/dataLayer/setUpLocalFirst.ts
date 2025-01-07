import { PgliteDatabase, PgliteQueryResultHKT } from 'drizzle-orm/pglite';
import { getTableName, isTable, Table, TableConfig } from 'drizzle-orm';
import { Column } from 'drizzle-orm/column';

import { createLocalFirstSchemaSql } from './local-db-gen';
import {
  AnyPgTable,
  getTableConfig,
  PgDatabase,
  PgTable,
  PgTableExtraConfig,
} from 'drizzle-orm/pg-core';
import * as schema from 'local-first-chat-api/schema';
import {
  ExtractTableRelationsFromSchema,
  ExtractTablesWithRelations,
} from 'drizzle-orm';
import { PGlite } from '@electric-sql/pglite';
// Type definitions

// Define the symbols we need
const TableSymbols = {
  Name: Symbol.for('drizzle:Name'),
  Schema: Symbol.for('drizzle:Schema'),
  Columns: Symbol.for('drizzle:Columns'),
  OriginalName: Symbol.for('drizzle:OriginalName'),
  BaseName: Symbol.for('drizzle:BaseName'),
  IsAlias: Symbol.for('drizzle:IsAlias'),
  ExtraConfigColumns: Symbol.for('drizzle:ExtraConfigColumns'),
} as const;

type DrizzleTable = Table<TableConfig<Column>>;

export type DrizzleTableInfo = {
  name: string;
  originalName: string;
  schema: string | undefined;
  columns: Record<string, unknown>;
  baseName: string;
  isAlias: boolean;
  extraConfigColumns: Record<string, unknown>;
};

function getDrizzleTableInfo(table: DrizzleTable): DrizzleTableInfo {
  return {
    name: table[TableSymbols.Name] as string,
    originalName: table[TableSymbols.OriginalName] as string,
    schema: table[TableSymbols.Schema] as string | undefined,
    columns: table[TableSymbols.Columns] as Record<string, unknown>,
    baseName: table[TableSymbols.BaseName] as string,
    isAlias: table[TableSymbols.IsAlias] as boolean,
    extraConfigColumns: table[TableSymbols.ExtraConfigColumns] as Record<
      string,
      unknown
    >,
  };
}

type SafeSchema = Record<string, DrizzleTable>;

/**
 * Sets up local-first tables and triggers for PGLite at runtime.
 * This should be called after your base tables are created but before using the database.
 */
export async function setupLocalFirstSchema<
  TSchema extends Record<string, unknown>,
>(
  db: PgliteDatabase<TSchema> & {
    $client: PGlite;
  },
  tablesToSync: Array<keyof TSchema>,
) {
  try {
    console.log('Setting up local-first schema...');
    // First create the shared changes table if it doesn't exist
    console.log('Creating shared changes table...');
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS changes (
          id BIGSERIAL PRIMARY KEY,
          operation TEXT NOT NULL,
          value JSONB NOT NULL,
          write_id UUID NOT NULL,
          transaction_id XID8 NOT NULL
        );
      `);
      console.log('Successfully created/verified changes table');
    } catch (error) {
      console.error('Failed to create changes table:', error);
      throw new Error('Failed to create required changes table');
    }
    const count = 0;
    // Set up each table
    for (const table of Object.values(db._.fullSchema) as Array<
      PgTable<TableConfig>
    >) {
      if (!isTable(table)) continue;
      if (!tablesToSync.includes(getDrizzleTableInfo(table).baseName)) continue;
      const tableInfo = getTableConfig(table);
      const tableName = tableInfo.name;
      // if (count) return;
      // count++;

      console.log(`Processing table:`, tableName);
      console.log(`Setting up local-first schema for table: ${tableName}`);

      try {
        const statements = await createLocalFirstSchemaSql(db, tableInfo);
        console.log(
          `Generated ${statements.length} SQL statements for ${tableName}`,
        );
        for (const [index, stmt] of statements) {
          try {
            await db.execute(stmt);
            console.log(
              `Successfully executed statement ${index + 1}/${statements.length} for ${tableName}`,
            );
          } catch (error) {
            console.error(
              `Failed to execute statement ${index + 1} for ${tableName}:`,
              error,
            );
            console.error('Failed statement:', stmt);
            throw error;
          }
        }
        console.log(`Successfully set up local-first schema for ${tableName}`);
      } catch (error) {
        console.error(
          `Failed to set up local-first schema for ${tableName}:`,
          error,
        );
        throw new Error(
          `Failed to set up local-first schema for table ${tableName}`,
        );
      }
    }

    console.log('Successfully completed local-first schema setup');
  } catch (error) {
    console.error('Fatal error during local-first schema setup:', error);
    throw new Error(
      'Failed to set up local-first schema: ' +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

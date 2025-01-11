import { pgTable, pgView, PgColumnBuilderBase } from 'drizzle-orm/pg-core';

import { ElectricTableFn } from './types';
import {
  localBookkeepingColumns,
  syncedBookkeepingColumns,
} from './bookkeeping';
import {
  rewriteReferencesForLocalOrSynced,
  generateColumnCaseStatement,
  getUserColumns,
} from './utils';
import { SQL, sql } from 'drizzle-orm';

/**
 * Creates a local-first table setup with Drizzle ORM, consisting of:
 *
 * 1. A "synced_[table]" table containing server-synced state
 * 2. A "local_[table]" table containing pending local changes
 * 3. A "[table]" view that merges both tables with proper precedence
 *
 * The view automatically handles:
 * - Merging local and synced state using COALESCE and CASE statements
 * - Tracking which columns have local changes via changed_columns array
 * - Filtering out soft-deleted records
 *
 * @example
 * ```typescript
 * const { localTable, syncedTable, combinedTableView } = electricTable(
 *   'todos',
 *   {
 *     id: uuid('id').primaryKey(),
 *     title: text('title').notNull(),
 *     completed: boolean('completed').notNull().default(false),
 *   }
 * );
 * ```
 *
 * @param tableName - Name of the table (without prefixes)
 * @param columns - Drizzle column definitions
 * @param tableConfig - Optional extra table configuration
 * @returns Object containing localTable, syncedTable, and combinedTableView
 */
export const electricTable: ElectricTableFn = (
  tableName,
  columns,
  tableConfig,
) => {
  // Build table names with prefixes
  const localTableName = `local_${tableName}`;
  const syncedTableName = `synced_${tableName}`;

  const localColumns = {
    ...rewriteReferencesForLocalOrSynced(columns, 'local_'),
    ...localBookkeepingColumns,
  } as const;

  const syncedColumns = {
    ...rewriteReferencesForLocalOrSynced(columns, 'synced_'),
    ...syncedBookkeepingColumns,
  } as const;

  const localTable = pgTable(localTableName, localColumns, tableConfig);
  const syncedTable = pgTable(syncedTableName, syncedColumns, tableConfig);

  const userColumns = getUserColumns(columns);

  const selectList: SQL[] = [
    sql`COALESCE("local"."id", "synced"."id") AS "id"`,
  ];

  for (const colName of userColumns) {
    if (colName === 'id') continue;
    selectList.push(generateColumnCaseStatement(colName));
  }

  const viewSql = sql<string>`
    SELECT ${sql.join(selectList, sql`, `)}
    FROM ${syncedTable} AS "synced"
    FULL OUTER JOIN ${localTable} AS "local"
      ON "synced"."id" = "local"."id"
    WHERE "local"."id" IS NULL OR "local"."is_deleted" = false
  `;

  const combinedTableView = pgView(tableName, columns).as(viewSql);

  return {
    localTable,
    syncedTable,
    combinedTableView,
  };
};

export * from './types';

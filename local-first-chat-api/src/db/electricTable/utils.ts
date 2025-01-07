import { SQL, sql } from 'drizzle-orm';
import { ColumnDefinition } from './types';

/**
 * Rewrites table references in column definitions to point to either local_ or synced_ variants
 * @param columns - The original column definitions
 * @param prefix - The prefix to add ('local_' or 'synced_')
 * @returns A new column definitions object with updated references
 */
export function rewriteReferencesForLocalOrSynced(
  columns: Record<string, ColumnDefinition>,
  prefix: 'local_' | 'synced_',
): Record<string, ColumnDefinition> {
  const cloned = { ...columns };

  for (const colName in cloned) {
    const colDef = cloned[colName];
    if (
      typeof colDef === 'object' &&
      (colDef as any)?._foreignKeyConfig?.foreignTableName
    ) {
      const oldTableName = (colDef as any)._foreignKeyConfig.foreignTableName;
      (colDef as any)._foreignKeyConfig.foreignTableName =
        prefix + oldTableName;
    }
  }

  return cloned;
}

/**
 * Generates a CASE statement for a column that checks if it's in changed_columns
 * @param columnName - The name of the column
 * @returns SQL fragment for the CASE statement
 */
export function generateColumnCaseStatement(columnName: string): SQL {
  return sql`CASE
    WHEN ${sql.raw(`'${columnName}'`)} = ANY("local"."changed_columns")
    THEN "local".${sql.raw(columnName)}
    ELSE "synced".${sql.raw(columnName)}
  END AS ${sql.raw(columnName)}`;
}

/**
 * Filters out bookkeeping columns from the column list
 * @param columns - Object containing column definitions
 * @returns Array of column names excluding bookkeeping columns
 */
export function getUserColumns(columns: Record<string, unknown>): string[] {
  const bookkeepingColumns = ['changed_columns', 'is_deleted', 'write_id'];
  return Object.keys(columns).filter((c) => !bookkeepingColumns.includes(c));
}

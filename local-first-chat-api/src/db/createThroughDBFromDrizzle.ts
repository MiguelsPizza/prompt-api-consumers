import {
  BuildColumns,
  BuildExtraConfigColumns,
  ColumnBuilderBaseConfig,
  ColumnDataType,
  sql,
  SQL,
} from 'drizzle-orm';
import {
  pgTable,
  // PgTableFn,
  pgView,
  integer,
  serial,
  text,
  boolean,
  timestamp,
  uuid,
  jsonb,
  AnyPgTable,
  AnyPgColumn,
  TableConfig,
  ForeignKey,
  PgColumnBuilderBase,
  PgTableWithColumns,
  PgTableExtraConfigValue,
  PgView,
  ManualViewBuilder,
  PgViewWithSelection,
  QueryBuilder,
} from 'drizzle-orm/pg-core';

const qb = new QueryBuilder();

///////////////////////////////////////////////////////////////////
// Example "changes" table in Drizzle (can be re-used or renamed) //
///////////////////////////////////////////////////////////////////
export const changesTable = pgTable('changes', {
  id: serial('id').primaryKey(),
  operation: text('operation').notNull(),
  value: jsonb('value').notNull(),
  writeId: uuid('write_id').notNull(),
  transactionId: uuid('transaction_id').notNull(), // or big int, or XID8 as raw sql...
});

/////////////////////////////////////////////////////////////////////////////
// Extended scaffoldLocalSchema that automatically points references for   //
// a local table to the local_* variant (and likewise for synced).         //
//                                                                         //
// This means that if you have a column referencing “some_other_table.id,” //
// in your original columns object, we rewrite that so in localTable, it   //
// references local_some_other_table.id, and in syncedTable, it references //
// synced_some_other_table.id.                                             //
//                                                                         //
// NOTE: This is necessarily a bit “magical.” If your references are more  //
// nuanced (like custom naming, cross-database references, etc.), you      //
// might need to refine the logic.                                         //
/////////////////////////////////////////////////////////////////////////////
function rewriteReferencesForLocalOrSynced(
  columns: Record<
    string,
    | PgColumnBuilderBase<
        ColumnBuilderBaseConfig<ColumnDataType, string>,
        object
      >
    | ForeignKey
  >,
  tablePrefix: 'local_' | 'synced_',
) {
  // We'll clone the columns object, detect any references, and rename them.
  const cloned = { ...columns };

  for (const colName in cloned) {
    const colDef = cloned[colName];

    // Drizzle's .references(...) typically yields a ForeignKey object
    // or a column object containing the foreign-key metadata.
    // We’ll do a duck-type check below.
    if (
      typeof colDef === 'object' &&
      (colDef as any)?._foreignKeyConfig != null &&
      (colDef as any)?._foreignKeyConfig?.foreignTableName
    ) {
      // Pull out the existing table name from the foreign key
      const oldTable = (colDef as any)._foreignKeyConfig.foreignTableName;
      // e.g. "conversations" or "users" etc.

      const newTable = tablePrefix + oldTable;
      // e.g. local_conversations, synced_conversations

      // Shallow clone so we can override the foreign-key config
      const newForeignKeyConfig = {
        ...(colDef as any)._foreignKeyConfig,
        foreignTableName: newTable, // rename e.g. "conversations" → "local_conversations"
      };
      // Then reassign it
      (cloned[colName] as any)._foreignKeyConfig = newForeignKeyConfig;
    }
  }

  return cloned;
}

/**
 * A small helper function that outputs the "CASE WHEN changed_columns ... THEN local.col ELSE synced.col END"
 * logic. You can call this for each column you want to conditionally override.
 */
function overrideLocalOrSynced(columnName: string) {
  return sql`
    case
      when local.${sql.identifier('changed_columns')} is not null
        and '${columnName}' = any(local.${sql.identifier('changed_columns')})
      then local.${sql.identifier(columnName)}
      else synced.${sql.identifier(columnName)}
    end
  `;
}

export interface PgTableFn<TSchema extends string | undefined = undefined> {
  <
    TTableName extends string,
    TColumnsMap extends Record<string, PgColumnBuilderBase>,
  >(
    name: TTableName,
    columns: TColumnsMap,
    extraConfig?: (
      self: BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>,
    ) => PgTableExtraConfigValue[],
  ): {
    localTable: PgTableWithColumns<{
      name: TTableName;
      schema: TSchema;
      columns: BuildColumns<TTableName, TColumnsMap, 'pg'>;
      dialect: 'pg';
    }>;
    syncedTable: PgTableWithColumns<{
      name: TTableName;
      schema: TSchema;
      columns: BuildColumns<TTableName, TColumnsMap, 'pg'>;
      dialect: 'pg';
    }>;
    combinedTableView: PgViewWithSelection<TTableName, false, TColumnsMap>; //= PgView<TName, TExisting, TSelectedFields> & TSelectedFields;
  };
}

export const electricTable: PgTableFn = (name, columns, tableConfig) => {
  /**
   * The snippet below illustrates the creation of:
   *   (1) “synced_<name>” table - for server-synced state
   *   (2) “local_<name>” table - for local state
   *   (3) A combined read-only view named "<name>"
   * Then triggers and functions remain raw SQL.
   *
   * We extend that logic by hooking into Drizzle’s references to
   * rename them to “local_XXX” or “synced_XXX.”
   **/

  // Add shared bookkeeping columns that should be present in both synced and local tables
  const syncedBookkeepingColumns = {
    writeId: uuid('write_id'),
  };

  const localBookkeepingColumns = {
    changedColumns: text('changed_columns').array(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    writeId: uuid('write_id').notNull(),
  };

  const syncedTableName = `synced_${name}`;
  const localTableName = `local_${name}`;

  // Add bookkeeping columns to both tables
  const localColumns = {
    ...rewriteReferencesForLocalOrSynced(columns, 'local_'),
    ...localBookkeepingColumns,
  } as const;

  const syncedColumns = {
    ...rewriteReferencesForLocalOrSynced(columns, 'synced_'),
    ...syncedBookkeepingColumns,
  } as const;

  // const syncedTableName = `synced_${name}`;
  // const localTableName = `local_${name}`;

  // // For local columns, rewrite foreign keys to local_Whatever
  // const localColumns = rewriteReferencesForLocalOrSynced(columns, 'local_');

  // // For synced columns, rewrite foreign keys to synced_Whatever
  // const syncedColumns = rewriteReferencesForLocalOrSynced(columns, 'synced_');

  const localTable = pgTable(localTableName, localColumns, tableConfig);
  const syncedTable = pgTable(syncedTableName, syncedColumns, tableConfig);

  //////////////////////////////////////////////////////////////////////
  // Construct a Drizzle view that merges local and synced tables.     //
  // We'll use the new overrideLocalOrSynced(...) function for columns //
  // that should be locally overridden.                                //
  //////////////////////////////////////////////////////////////////////

  // // Example: build typed columns config for the merged view.
  // // In a real implementation, expand to all columns from `columns`.
  // // Update the view generation to handle all columns dynamically
  // const viewColumns: Record<string, AnyPgColumn> = {};

  const temp = `CREATE OR REPLACE VIEW ${name} AS
  SELECT
    COALESCE(local.id, synced.id) AS id,
    ${Object.values(columns)
      .map(
        (column) => `
          CASE
        WHEN '${column._.name}' = ANY(local.changed_columns)
          THEN local.${column._.name}
          ELSE synced.${column._.name}
        END AS ${column._.name},`,
      )
      .join('\n')}
  FROM ${name}_synced AS synced
  FULL OUTER JOIN ${name}_local AS local
    ON synced.id = local.id
    WHERE local.id IS NULL OR local.is_deleted = FALSE;`;

  // // Add all original columns to the view
  // for (const [columnName, column] of Object.entries(columns)) {
  //   viewColumns[columnName] = column;
  // }
  // const selections: Record<string, SQL> = {};

  // // Generate CASE statements for all columns
  // for (const columnName of Object.keys(columns)) {
  //   selections[columnName] = overrideLocalOrSynced(columnName);
  // }

  // // Add the ID coalesce
  // selections.id = sql`coalesce("local"."id", "synced"."id")`;

  const combinedTableView = pgView(name, columns)
    .as(sql`${syncedTable} as "synced" FULL OUTER JOIN ${localTable} as "local" ON "synced"."id" = "local"."id"
        where(sql"local"."id" is null OR "local"."is_deleted" = false`);

  return {
    localTable,
    syncedTable,
    combinedTableView,
  };
};

// // Optionally, we might keep an array of raw-sql triggers as before.
// export const localFirstTriggersSql: SQL[] = [
//   //  ... (e.g. for “INSTEAD OF” triggers, sync logic, etc.)
// ];

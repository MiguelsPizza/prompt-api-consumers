import {
  AnyPgColumn,
  AnyPgTable,
  PgBoolean,
  PgDialect,
  PgEnumColumn,
  PgReal,
  PgText,
  PgTimestampString,
  PgUUID,
} from 'drizzle-orm/pg-core';

// import { DrizzleSymbolInfo } from './setUpLocalFirst';

// Failed statement: CREATE TABLE IF NOT EXISTS conversations_synced (
//   id STRING  NOT NULL DEFAULT [object Object],
//   name STRING  NOT NULL,
//   conversation_summary STRING,
//   system_prompt STRING,
//   top_k NUMBER  NOT NULL,
//   temperature NUMBER  NOT NULL,
//   user_id STRING  NOT NULL,
//   softDeleted BOOLEAN  NOT NULL,
//   llm_id STRING  NOT NULL DEFAULT chrome-ai,
//   created_at STRING  NOT NULL DEFAULT [object Object],
//   updated_at STRING  NOT NULL DEFAULT [object Object],
//   deleted_at STRING,
//   server_synced BOOLEAN  NOT NULL,
//   server_synced_date STRING,
//     write_id UUID

/**
 * Generate the SQL statements needed for a "local-first" workflow
 * given a Drizzle table definition (e.g. your `conversations` table).
 *
 * Instead of executing them at runtime, you can place the returned strings
 * in your Drizzle migration files so they are run on your database once.
 *
 * Usage in a Drizzle migration:
 *
 *   // 1) Import this function
 *   // 2) In your "up" migration, call createLocalFirstSchemaSql(conversations)
 *   // 3) Then run sql.raw(...) or similar.
 *   //
 *   // Example:
 *   // export async function up(db) {
 *   //   const statements = createLocalFirstSchemaSql(conversations);
 *   //   for (const stmt of statements) {
 *   //     await db.execute(stmt);
 *   //   }
 *   // }
 *
 */
import { ColumnBaseConfig, SQL, Table, TableConfig, sql } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { PgliteDatabase } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';

type DrizzleTable = Table<TableConfig<AnyPgColumn>>;

const pgDialect = new PgDialect();

/**
 * Helper to return a "raw" CREATE COLUMN definition from a Drizzle column definition.
 */
function getColumnDefinition(colDef: AnyPgColumn): string {
  // Drizzle's internal SQL object for the column DDL
  const sqlExpression = colDef.getSQL();

  // Convert that to the final parameterized SQL text & values
  const { sql: parameterizedSql, params } = pgDialect.sqlToQuery(sqlExpression);

  // If you only need the type (e.g. "TEXT" or "UUID")
  // you can do this:
  // const rawType = colDef.getSQLType();

  // If Drizzle generated placeholders ("... = $1"), replace them or interpret them if needed.
  // Usually, for a column definition, there are no real placeholders; but for a default expression,
  // you might see placeholders in the final text. If so, handle them as needed.

  // We'll return the text as-is for demonstration.
  // `parameterizedSql` might look like `"my_column" text default 'something' not null`
  // (with double-quotes around the column name).
  // The `params` array holds any dynamic values.
  return parameterizedSql;
}

// Usage example for a Drizzle table definition
function printColumnDefinitions(columns: Record<string, AnyPgColumn>) {
  Object.entries(columns).forEach(([columnName, colDef]) => {
    console.log(`Column ${columnName} -> ${getColumnDefinition(colDef)}`);
  });
}

// type PgColumnTypes<T extends ColumnBaseConfig<any, any>> =
//   | PgText<T>
//   | PgUUID<T>
//   | PgTimestampString<T>
//   | PgBoolean<T>
//   | PgReal<T>
//   | PgEnumColumn<T & { enumValues: [string, ...string[]] }>;

export type DrizzleColumnInfo = {
  name: string;
  keyAsName: boolean;
  primary: boolean;
  notNull: boolean;
  default: unknown;
  type: string;
  enumValues?: string[];
};

export type DrizzleSymbolInfo = {
  name: string;
  originalName: string;
  schema: string | undefined;
  columns: Record<string, DrizzleColumnInfo>;
  baseName: string;
  isAlias: boolean;
  extraConfigColumns: Record<string, unknown>;
};

// const getColumnInfo = ([colName, colDef]: [string, DrizzleColumnInfo]) => {
//   const sqlType = colDef.getSQLType();
//   console.log({ colDef, sqlType });
//   const isPk = colDef.primary;
//   const isNotNull = colDef.notNull;
//   let defaultValueString = colDef.hasDefault ? (colDef.default as SQL) : null;
//   if (defaultValueString) {
//     defaultValueString = defaultValueString.queryChunks
//       .map((chunk) => chunk?.value?.join(''))
//       .join('');
//   }
//   // // Drizzle stores information in colDef.config.
//   // // "colDef.config.primaryKey", "colDef.config.notNull", "colDef.config.hasDefault", etc.
//   // // For the type, we often rely on colDef.config.dataType, but that is sometimes typed differently.
//   // // You can adjust or rename as needed:
//   // const isPk = colDef;
//   // const isNotNull = colDef.isNotNull;
//   // const defaultValue = colDef.default;
//   // "dataType" is Drizzle's internal. If you need a raw PG type, you might map them yourself.

//   // For demonstration, we'll pass the "drizzleType" straight through to SQL.
//   // Real usage might need manual mapping or might rely on "colDef.toSQL()" if Drizzle provides a helper.
//   // const computedColumnType = drizzleType.toUpperCase();

//   const temp = {
//     name: colName,
//     type: sqlType,
//     isPk,
//     isNotNull,
//     defaultValue: defaultValueString,
//   };
//   console.log({ temp });
//   return temp;
// };

// const columns = Object.entries(columnsObj).map(
//   ([colName, colDef]: [string, AnyPgColumn]) => {
//     const getSQL = colDef.getSQL();
//     const sql = getSQL.getSQL();
//     const getSQLType = colDef.getSQLType();
//     console.log({ colDef, sql, getSQLType });
//     const isPk = colDef.primary;
//     const isNotNull = colDef.notNull;
//     const defaultValue = colDef.default;

//     let computedColumnType: string;

//     switch (true) {
//       case colDef instanceof PgText:
//         computedColumnType = 'TEXT';
//         break;

//       case colDef instanceof PgUUID:
//         computedColumnType = 'UUID';
//         break;

//       case colDef instanceof PgTimestampString:
//         computedColumnType = 'TIMESTAMP WITH TIME ZONE';
//         break;

//       case colDef instanceof PgBoolean:
//         computedColumnType = 'BOOLEAN';
//         break;

//       case colDef instanceof PgReal:
//         computedColumnType = 'REAL';
//         break;

//       case colDef instanceof PgEnumColumn:
//         const enumCol = colDef as PgEnumColumn<any>;
//         computedColumnType = `${enumCol.enumName}`; // This will be the enum type name in Postgres
//         break;

//       default:
//         console.warn(`Unknown column type for ${colName}:`, colDef);
//         computedColumnType = 'TEXT'; // fallback
//     }

//     return {
//       name: colName,
//       type: computedColumnType,
//       isPk,
//       isNotNull,
//       defaultValue,
//     };
//   },
// );

export async function createLocalFirstSchemaSql<
  TSchema extends Record<string, unknown>,
>(
  db: PgliteDatabase<TSchema> & {
    $client: PGlite;
  },
  tableInfo: ReturnType<typeof getTableConfig>,
): Promise<string[]> {
  // Grab schema info from the Drizzle table
  const columnsObj = tableInfo.columns; // an object { colName: ColumnConfig, ... }
  const baseTableName = tableInfo.name;
  console.log({ columnsObj });
  // Convert Drizzle's internal column config to a simplified array of metadata.
  // We'll store name, type, isPk, isNotNull, defaultValue.
  // NOTE: The exact usage depends on Drizzle's internal API, which may change.

  const syncedTableName = `${baseTableName}_synced`;
  const localTableName = `${baseTableName}_local`;
  const columns = tableInfo.columns;
  // Helper to generate columns for CREATE statements
  // We'll treat columns exactly as in the earlier example.
  function generateColumnDefinitions(forSynced: boolean) {
    return columns.map((col) => {
      const isPk = col.primary;
      const pkClause = isPk ? 'PRIMARY KEY' : '';
      const notNull = forSynced && col.notNull ? 'NOT NULL' : '';
      console.log(col.generated);
      // Skip defaults for underlying tables - they'll be handled by the view's INSERT trigger
      return `  ${col.name} ${col.getSQLType()} ${pkClause} ${notNull}`.trim();
    }).join(`,
        `);
  }

  // Generate the SELECT clause for the merged view
  const mergedSelects = columns.map((col) => {
    if (col.primary) {
      // primary key column always coalesces local->synced
      return `  COALESCE(local.${col.name}, synced.${col.name}) AS ${col.name}`;
    }
    // for normal columns, local overrides only if changed_columns includes it
    return `
  CASE
    WHEN local.changed_columns IS NOT NULL
         AND '${col.name}' = ANY(local.changed_columns)
      THEN local.${col.name}
    ELSE synced.${col.name}
  END AS ${col.name}`.trim();
  });

  // Grab name of the PK column (to do the JOIN)
  const pkName = columns.find((c) => c.primary)?.name ?? 'id';

  // We'll produce a sequence of SQL statements that you can run in your migration
  const statements: string[] = [];
  async function executeWithLogging(db: any, sql: string, description: string) {
    try {
      const test = await db.execute(sql);
      if (test) {
        console.log(JSON.stringify(test, null, 2));
      }
      console.log(`Successfully executed: ${description}`);
    } catch (error) {
      console.error(`Failed to execute: ${description}`);
      console.error('SQL:', sql);
      console.error('Error:', error);
      throw error;
    }
  }

  // 1) Create {base}_synced
  await executeWithLogging(
    db,
    `
CREATE TABLE IF NOT EXISTS ${syncedTableName} (
${generateColumnDefinitions(true)},
  write_id UUID
);
`.trim(),
    `Create synced table ${syncedTableName}`,
  );

  // 2) Create {base}_local
  await executeWithLogging(
    db,
    `
CREATE TABLE IF NOT EXISTS ${localTableName} (
${generateColumnDefinitions(false)},
  changed_columns TEXT[],
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  write_id UUID NOT NULL
);
`.trim(),
    `Create local table ${localTableName}`,
  );

  // // Add this before trying to drop the table
  // await executeWithLogging(
  //   db,
  //   `
  // SELECT
  //   table_schema,
  //   table_name,
  //   table_type
  // FROM information_schema.tables
  // WHERE table_name LIKE '%conversations%';
  // `,
  //   'checking what conversations objects exist',
  // );
  // await executeWithLogging(
  //   db,
  //   `DROP TABLE IF EXISTS ${baseTableName} CASCADE;`,
  //   'dropping conversations',
  // );

  // 3) Create or replace merged view
  await executeWithLogging(
    db,
    `
CREATE OR REPLACE VIEW ${baseTableName} AS
  SELECT
${mergedSelects.join(',\n')}
  FROM ${syncedTableName} AS synced
  FULL OUTER JOIN ${localTableName} AS local
    ON synced.${pkName} = local.${pkName}
  WHERE local.${pkName} IS NULL OR local.is_deleted = FALSE;
`.trim(),
    `Create merged view ${baseTableName}`,
  );
  // 4) Cleanup triggers
  await executeWithLogging(
    db,
    `CREATE OR REPLACE FUNCTION ${baseTableName}_delete_local_on_synced_insert_and_update()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM ${localTableName}
    WHERE ${localTableName}.${pkName} = NEW.${pkName}
      AND ${localTableName}.write_id IS NOT NULL
      AND ${localTableName}.write_id = NEW.write_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
    `Create cleanup function 1 for ${baseTableName}`,
  );

  await executeWithLogging(
    db,
    `DROP TRIGGER IF EXISTS ${baseTableName}_delete_local_on_synced_insert ON ${syncedTableName} CASCADE;`,
    `Drop cleanup trigger 1 for ${baseTableName}`,
  );

  await executeWithLogging(
    db,
    `CREATE TRIGGER ${baseTableName}_delete_local_on_synced_insert
AFTER INSERT OR UPDATE ON ${syncedTableName}
FOR EACH ROW
EXECUTE FUNCTION ${baseTableName}_delete_local_on_synced_insert_and_update();`,
    `Create cleanup trigger 1 for ${baseTableName}`,
  );

  await executeWithLogging(
    db,
    `CREATE OR REPLACE FUNCTION ${baseTableName}_delete_local_on_synced_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM ${localTableName}
    WHERE ${localTableName}.${pkName} = OLD.${pkName};
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;`,
    `Create cleanup function 2 for ${baseTableName}`,
  );

  await executeWithLogging(
    db,
    `DROP TRIGGER IF EXISTS ${baseTableName}_delete_local_on_synced_delete ON ${syncedTableName} CASCADE;`,
    'drop Trigger',
  );
  await executeWithLogging(
    db,
    `CREATE TRIGGER ${baseTableName}_delete_local_on_synced_delete
AFTER DELETE ON ${syncedTableName}
FOR EACH ROW
EXECUTE FUNCTION ${baseTableName}_delete_local_on_synced_delete();`,
    `Create cleanup trigger 2 for ${baseTableName}`,
  );

  // 5) A shared "changes" table (optional if you have it already)
  await executeWithLogging(
    db,
    `CREATE TABLE IF NOT EXISTS changes (
  id BIGSERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  value JSONB NOT NULL,
  write_id UUID NOT NULL,
  transaction_id XID8 NOT NULL
);`,
    'Create changes table',
  );

  // 6) Insert trigger
  const nonPkCols = columns.filter((col) => !col.primary);
  const changedColsArray = nonPkCols.map((col) => `'${col.name}'`).join(', ');

  await executeWithLogging(
    db,
    `CREATE OR REPLACE FUNCTION ${baseTableName}_insert_trigger()
RETURNS TRIGGER AS $$
DECLARE
  local_write_id UUID := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM ${syncedTableName} WHERE ${pkName} = NEW.${pkName}) THEN
    RAISE EXCEPTION 'Cannot insert: primary key already exists in the synced table.';
  END IF;
  IF EXISTS (SELECT 1 FROM ${localTableName} WHERE ${pkName} = NEW.${pkName}) THEN
    RAISE EXCEPTION 'Cannot insert: primary key already exists in the local table.';
  END IF;

  INSERT INTO ${localTableName} (
    ${columns.map((c) => c.name).join(', ')},
    changed_columns,
    write_id
  )
  VALUES (
    ${columns.map((c) => `NEW.${c.name}`).join(', ')},
    ARRAY[${changedColsArray}],
    local_write_id
  );

  INSERT INTO changes (operation, value, write_id, transaction_id)
  VALUES (
    'insert',
    jsonb_build_object(
      ${columns.map((c) => `'${c.name}', NEW.${c.name}`).join(', ')}
    ),
    local_write_id,
    pg_current_xact_id()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
    `Create insert function for ${baseTableName}`,
  );

  await executeWithLogging(
    db,
    `DROP TRIGGER IF EXISTS ${baseTableName}_insert ON ${baseTableName} CASCADE;`,
    'drop insert',
  );
  await executeWithLogging(
    db,
    `
CREATE TRIGGER ${baseTableName}_insert
INSTEAD OF INSERT ON ${baseTableName}
FOR EACH ROW
EXECUTE FUNCTION ${baseTableName}_insert_trigger();`,
    `Create insert trigger for ${baseTableName}`,
  );

  // 7) Update trigger
  const distinctCheckSnippets = nonPkCols
    .map(
      (col) => `
    IF NEW.${col.name} IS DISTINCT FROM syncedRow.${col.name} THEN
      changed_cols := array_append(changed_cols, '${col.name}');
    END IF;`,
    )
    .join('\n');

  // Build the big CASE for merging changed columns
  const setClauses = nonPkCols
    .map((col) => {
      return `
      "${col.name}" =
        CASE
          WHEN NEW.${col.name} IS DISTINCT FROM syncedRow.${col.name}
            THEN NEW.${col.name}
          ELSE ${localTableName}."${col.name}"
        END,`;
    })
    .join('');

  const changedColumnsMerge = `
changed_columns = (
  SELECT array_agg(DISTINCT col)
  FROM (
    SELECT unnest(${localTableName}.changed_columns) AS col
    UNION
    SELECT unnest(ARRAY[${changedColsArray}]) AS col
  ) AS subCols
  WHERE (
    CASE
      ${nonPkCols
        .map(
          (col) => `
      WHEN col = '${col.name}'
        THEN COALESCE(NEW.${col.name}, ${localTableName}."${col.name}") IS DISTINCT FROM syncedRow.${col.name}`,
        )
        .join('\n')}
    END
  )
),`.trim();

  await executeWithLogging(
    db,
    `CREATE OR REPLACE FUNCTION ${baseTableName}_update_trigger()
RETURNS TRIGGER AS $$
DECLARE
  syncedRow RECORD;
  localRow RECORD;
  changed_cols TEXT[] := '{}';
  local_write_id UUID := gen_random_uuid();
BEGIN
  SELECT * INTO syncedRow FROM ${syncedTableName} WHERE ${pkName} = NEW.${pkName};
  SELECT * INTO localRow FROM ${localTableName} WHERE ${pkName} = NEW.${pkName};

  IF NOT FOUND THEN
    -- The row wasn't in local. Insert it, capturing changed columns from the synced row.
    ${distinctCheckSnippets}
    INSERT INTO ${localTableName} (
      ${columns.map((c) => c.name).join(', ')},
      changed_columns,
      write_id
    )
    VALUES (
      ${columns.map((c) => `NEW.${c.name}`).join(', ')},
      changed_cols,
      local_write_id
    );
  ELSE
    -- If the row is already in local, update it.
    UPDATE ${localTableName}
    SET
      ${setClauses}
      ${changedColumnsMerge}
      write_id = local_write_id
    WHERE ${pkName} = NEW.${pkName};
  END IF;

  -- Record the update
  INSERT INTO changes (operation, value, write_id, transaction_id)
  VALUES (
    'update',
    jsonb_strip_nulls(jsonb_build_object(
      ${columns.map((c) => `'${c.name}', NEW.${c.name}`).join(', ')}
    )),
    local_write_id,
    pg_current_xact_id()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
    `Create update function for ${baseTableName}`,
  );

  await executeWithLogging(
    db,
    `DROP TRIGGER IF EXISTS ${baseTableName}_update ON ${baseTableName} CASCADE;`,
    'drop',
  );
  await executeWithLogging(
    db,
    `
CREATE TRIGGER ${baseTableName}_update
INSTEAD OF UPDATE ON ${baseTableName}
FOR EACH ROW
EXECUTE FUNCTION ${baseTableName}_update_trigger();`,
    `Create update trigger for ${baseTableName}`,
  );

  // 8) Delete trigger
  await executeWithLogging(
    db,
    `CREATE OR REPLACE FUNCTION ${baseTableName}_delete_trigger()
RETURNS TRIGGER AS $$
DECLARE
  local_write_id UUID := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM ${localTableName} WHERE ${pkName} = OLD.${pkName}) THEN
    UPDATE ${localTableName}
      SET is_deleted = TRUE,
          write_id = local_write_id
      WHERE ${pkName} = OLD.${pkName};
  ELSE
    INSERT INTO ${localTableName} (
      ${pkName},
      is_deleted,
      write_id
    )
    VALUES (
      OLD.${pkName},
      TRUE,
      local_write_id
    );
  END IF;

  INSERT INTO changes (operation, value, write_id, transaction_id)
  VALUES (
    'delete',
    jsonb_build_object('${pkName}', OLD.${pkName}),
    local_write_id,
    pg_current_xact_id()
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;`,
    `Create delete function for ${baseTableName}`,
  );

  await executeWithLogging(
    db,
    `DROP TRIGGER IF EXISTS ${baseTableName}_delete ON ${baseTableName} CASCADE;`,
    'drop',
  );
  await executeWithLogging(
    db,
    `
CREATE TRIGGER ${baseTableName}_delete
INSTEAD OF DELETE ON ${baseTableName}
FOR EACH ROW
EXECUTE FUNCTION ${baseTableName}_delete_trigger();`,
    `Create delete trigger for ${baseTableName}`,
  );

  // 9) Optional notify trigger
  await executeWithLogging(
    db,
    `CREATE OR REPLACE FUNCTION changes_notify_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NOTIFY changes;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
    'Create notify function for changes table',
  );

  await executeWithLogging(
    db,
    `DROP TRIGGER IF EXISTS changes_notify ON changes CASCADE;`,
    'temp',
  );
  await executeWithLogging(
    db,
    `
CREATE TRIGGER changes_notify
AFTER INSERT ON changes
FOR EACH ROW
EXECUTE FUNCTION changes_notify_trigger();`,
    'Create notify trigger for changes table',
  );

  return statements;
}

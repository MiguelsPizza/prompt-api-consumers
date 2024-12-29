// import { sql } from 'drizzle-orm';
// import {
//   conversationsLocal,
//   conversationsSynced,
//   changes,
//   conversations
// } from './schema';

// // Helper to get all column names from a table
// const getColumnNames = (table: any) =>
//   Object.keys(table).filter(key => !['_', '$'].includes(key));

// // Get conversation columns for changed_columns array
// const conversationColumns = getColumnNames(conversations)
//   .filter(col => !['id'].includes(col));

// // Create a type-safe column list string
// const columnList = sql.raw(
//   conversationColumns.map(col => `'${col}'`).join(', ')
// );

// export const createTriggerFunctions = sql`
// CREATE OR REPLACE FUNCTION conversations_insert_trigger()
// RETURNS TRIGGER AS $$
// DECLARE
//   local_write_id UUID := gen_random_uuid();
// BEGIN
//   -- Use table names from Drizzle schema
//   IF EXISTS (SELECT 1 FROM ${conversationsSynced} WHERE id = NEW.id) THEN
//     RAISE EXCEPTION 'Cannot insert: id already exists in the synced table';
//   END IF;
//   IF EXISTS (SELECT 1 FROM ${conversationsLocal} WHERE id = NEW.id) THEN
//     RAISE EXCEPTION 'Cannot insert: id already exists in the local table';
//   END IF;

//   -- Insert into local table using column names from schema
//   INSERT INTO ${conversationsLocal} (
//     ${sql.raw(conversationColumns.join(', '))},
//     changed_columns,
//     write_id
//   )
//   VALUES (
//     ${sql.raw(conversationColumns.map(col => `NEW.${col}`).join(', '))},
//     ARRAY[${columnList}],
//     local_write_id
//   );

//   -- Record the write operation
//   INSERT INTO ${changes} (
//     operation,
//     value,
//     write_id,
//     transaction_id
//   )
//   VALUES (
//     'insert',
//     jsonb_build_object(
//       'id', NEW.id,
//       ${sql.raw(conversationColumns
//   .map(col => `'${col}', NEW.${col}`)
//   .join(',\n      '))}
//     ),
//     local_write_id,
//     pg_current_xact_id()
//   );

//   RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// -- Update trigger with type-safe column handling
// CREATE OR REPLACE FUNCTION conversations_update_trigger()
// RETURNS TRIGGER AS $$
// DECLARE
//   synced ${conversationsSynced}%ROWTYPE;
//   local ${conversationsLocal}%ROWTYPE;
//   changed_cols TEXT[] := '{}';
//   local_write_id UUID := gen_random_uuid();
// BEGIN
//   SELECT * INTO synced FROM ${conversationsSynced} WHERE id = NEW.id;
//   SELECT * INTO local FROM ${conversationsLocal} WHERE id = NEW.id;

//   IF NOT FOUND THEN
//     -- Dynamic column change detection
//     ${sql.raw(conversationColumns
//     .map(col => `
//     IF NEW.${col} IS DISTINCT FROM synced.${col} THEN
//       changed_cols := array_append(changed_cols, '${col}');
//     END IF;`
//     ).join('\n'))}

//     INSERT INTO ${conversationsLocal} (
//       ${sql.raw(conversationColumns.join(', '))},
//       changed_columns,
//       write_id
//     )
//     VALUES (
//       ${sql.raw(conversationColumns.map(col => `NEW.${col}`).join(', '))},
//       changed_cols,
//       local_write_id
//     );
//   ELSE
//     UPDATE ${conversationsLocal}
//     SET
//       ${sql.raw(conversationColumns
//       .map(col => `${col} = CASE
//           WHEN NEW.${col} IS DISTINCT FROM synced.${col}
//           THEN NEW.${col}
//           ELSE local.${col}
//         END`)
//       .join(',\n      '))},
//       changed_columns = (
//         SELECT array_agg(DISTINCT col) FROM (
//           SELECT unnest(local.changed_columns) AS col
//           UNION
//           SELECT unnest(ARRAY[${columnList}]) AS col
//         ) AS cols
//         WHERE (
//           CASE col
//             ${sql.raw(conversationColumns
//         .map(col => `WHEN '${col}'
//                 THEN COALESCE(NEW.${col}, local.${col})
//                 IS DISTINCT FROM synced.${col}`)
//         .join('\n              '))}
//           END
//         )
//       ),
//       write_id = local_write_id
//     WHERE id = NEW.id;
//   END IF;

//   -- Record the update
//   INSERT INTO ${changes} (
//     operation,
//     value,
//     write_id,
//     transaction_id
//   )
//   VALUES (
//     'update',
//     jsonb_strip_nulls(jsonb_build_object(
//       'id', NEW.id,
//       ${sql.raw(conversationColumns
//           .map(col => `'${col}', NEW.${col}`)
//           .join(',\n      '))}
//     )),
//     local_write_id,
//     pg_current_xact_id()
//   );

//   RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;
// `;



// const { baseTableName, schemaDefinition, extraColumns = {} } = options;
// // Derive columns from the Drizzle table definition
// const columnNames = Object.keys(schemaDefinition).filter((k) => !k.startsWith('') && !k.startsWith('$'));
// // Name the synced and local tables
// const syncedName = ${ baseTableName }_synced;
// const localName = ${ baseTableName }_local;
// const viewName = baseTableName;
// // 1) Create the synced table
// await db.execute(sql`CREATE TABLE IF NOT EXISTS ${sql.raw(syncedName)}(${sql.join(columnNames.map((col) => sql`${sql.identifier(col)} ${getSQLDefinition(schemaDefinition[col])}`), sql`,`)}, write_id UUID);`);

// // 2) Create the local table with extra columns
// // e.g. changed_columns text[], is_deleted boolean, write_id, etc.
// await db.execute(sql`CREATE TABLE IF NOT EXISTS ${sql.raw(localName)}(${sql.join(columnNames.map((col) => sql`${sql.identifier(col)} ${getSQLDefinition(schemaDefinition[col])} NULL`), sql`,`)}, changed_columns TEXT[] DEFAULT '{}', is_deleted BOOLEAN DEFAULT false NOT NULL, write_id UUID NOT NULL, ${sql.raw(generateExtraColumnsSQL(extraColumns))});`);

// // 3) Create or replace the merged view
// // This is a simplified version that uses a FULL OUTER JOIN for a single PK "id"
// await db.execute(sql`CREATE OR REPLACE VIEW ${sql.raw(viewName)} AS SELECT COALESCE(local.id, synced.id) AS id, ${sql.join(columnNames.filter((col) => col !== 'id').map((col) => sql`
// CASE WHEN '${sql.raw(col)}' = ANY(local.changed_columns)
// THEN local.${sql.identifier(col)}
// ELSE synced.${sql.identifier(col)}
// END AS ${sql.identifier(col)}
//   `), sql`,`)
//   } FROM ${sql.raw(syncedName)} AS synced FULL OUTER JOIN ${sql.raw(localName)} AS local ON synced.id = local.id WHERE local.id IS NULL OR local.is_deleted = FALSE;`);

// // 4) Create triggers (in a similar way to your existing ElectricSQL logic)
// // We'll just show an "insert" trigger for brevity
// await db.execute(sql`CREATE OR REPLACE FUNCTION ${sql.raw(baseTableName)}_insert_trigger() RETURNS TRIGGER AS $$ DECLARE local_write_id UUID := gen_random_uuid(); BEGIN IF EXISTS(SELECT 1 FROM ${sql.raw(syncedName)} WHERE id = NEW.id) THEN RAISE EXCEPTION 'Cannot insert: id already exists in the synced table'; END IF; IF EXISTS(SELECT 1 FROM ${sql.raw(localName)} WHERE id = NEW.id) THEN RAISE EXCEPTION 'Cannot insert: id already exists in the local table'; END IF; INSERT INTO ${sql.raw(localName)} (${sql.join(columnNames.map((col) => sql.identifier(col)), sql`,`)}, changed_columns, write_id ) VALUES(${sql.join(columnNames.map((col) => sql`NEW.${sql.identifier(col)}`), sql`,`)}, ARRAY[${sql.join(columnNames.map((col) => sql`${sql.literal(col)}`), sql`,`)}], local_write_id); RETURN NEW; END; $$ LANGUAGE plpgsql; CREATE OR REPLACE TRIGGER ${sql.raw(viewName)}_insert INSTEAD OF INSERT ON ${sql.raw(viewName)} FOR EACH ROW EXECUTE FUNCTION ${sql.raw(baseTableName)}_insert_trigger();`);

// // ... similarly, generate update and delete triggers, plus the changes table logic
// // A small helper to interpret Drizzle column definitions into raw SQL text
// // /
// function getSQLDefinition(col: any): string {
//   // A “faked” approach for demonstration:
//   // In a real library, you’d parse the Drizzle column type, nullability, primary key info, etc.
//   if (col?.config?.primaryKey) {
//     return 'UUID PRIMARY KEY';
//   }
//   // just a naive default
//   return 'TEXT';
// }
//   /
//   Generate any extra columns code in the local table
//   /
//   function generateExtraColumnsSQL(extraCols: Record<string, any>): string {
//     return Object.entries(extraCols)
//       .map(([colName, drizzleDef]) => {
//         // parse drizzleDef, or fallback
//         return ${ colName } ${ fallbackColumnDefinition(drizzleDef) };
//       })
//       .join(',\n');
//   }
// function fallbackColumnDefinition(drizzleDef: any): string {
//   // naive fallback
//   return 'TEXT';
// }
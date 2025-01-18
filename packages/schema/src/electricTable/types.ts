import type { BuildColumns, BuildExtraConfigColumns, ColumnBuilderBaseConfig, ColumnDataType } from 'drizzle-orm';
import type { PgColumnBuilderBase, PgTableExtraConfigValue, PgTableWithColumns, PgViewWithSelection } from 'drizzle-orm/pg-core';

/**
 * Configuration type for foreign key references in columns
 */
export interface ForeignKeyConfig {
  _foreignKeyConfig?: {
    foreignTableName?: string;
  };
}

/**
 * Column definition type that can be either a Postgres column or a foreign key
 */
export type ColumnDefinition =
  | PgColumnBuilderBase<ColumnBuilderBaseConfig<ColumnDataType, string>, object>
  | ForeignKeyConfig;

/**
 * Function signature for creating electric tables
 */
export type ElectricTableFn<
  TSchema extends string | undefined = undefined,
> = <
  TTableName extends string,
  TColumnsMap extends Record<string, PgColumnBuilderBase>,
>(
  name: TTableName,
  columns: TColumnsMap,
  extraConfig?: (
    self: BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>,
  ) => PgTableExtraConfigValue[],
) => {
  /** The local table containing pending changes */
  localTable: PgTableWithColumns<{
    name: TTableName;
    schema: TSchema;
    columns: BuildColumns<TTableName, TColumnsMap, 'pg'>;
    dialect: 'pg';
  }>;
  /** The synced table containing server state */
  syncedTable: PgTableWithColumns<{
    name: TTableName;
    schema: TSchema;
    columns: BuildColumns<TTableName, TColumnsMap, 'pg'>;
    dialect: 'pg';
  }>;
  /** The combined view merging local and synced state */
  combinedTableView: PgViewWithSelection<TTableName, false, TColumnsMap>;
};

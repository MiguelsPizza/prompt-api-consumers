import { boolean, text, uuid } from 'drizzle-orm/pg-core';

/**
 * Columns added to the local table for tracking changes
 */
export const localBookkeepingColumns = {
  changedColumns: text('changed_columns').array(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  writeId: uuid('write_id').notNull(),
} as const;

/**
 * Columns added to the synced table for tracking state
 */
export const syncedBookkeepingColumns = {
  writeId: uuid('write_id'),
} as const;

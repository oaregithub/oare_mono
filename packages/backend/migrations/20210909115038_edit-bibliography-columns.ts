import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasCitationFormatColumn = await knex.schema.hasColumn(
    'bibliography',
    'citationFormat'
  );
    
  const hasTypeColumn = await knex.schema.hasColumn(
    'bibliography',
    'type'
  );
    
  const hasYearColumn = await knex.schema.hasColumn(
    'bibliography',
    'year'
  );
    
  const hasMonthColumn = await knex.schema.hasColumn(
    'bibliography',
    'month'
  );
    
  const hasDayColumn = await knex.schema.hasColumn(
    'bibliography',
    'day'
  );
    
  const hasEndYearColumn = await knex.schema.hasColumn(
    'bibliography',
    'end_year'
  );
    
  const hasEndMonthColumn = await knex.schema.hasColumn(
    'bibliography',
    'end_month'
  );
    
  const hasEndDayColumn = await knex.schema.hasColumn(
    'bibliography',
    'end_day'
  );
    
  const hasZotItemKeyColumn = await knex.schema.hasColumn(
    'bibliography',
    'zot_item_key'
  );

  if (hasCitationFormatColumn) {
    await knex.schema.table('bibliography', table => {
      table.renameColumn('citationFormat', 'short_cit');
    });
  }
    
  if (hasTypeColumn) {
    await knex.schema.table('bibliography', table => {
      table.dropColumn('type');
    });
  }
    
  if (hasYearColumn) {
    await knex.schema.table('bibliography', table => {
      table.dropColumn('year');
    });
  }
    
  if (hasMonthColumn) {
    await knex.schema.table('bibliography', table => {
      table.dropColumn('month');
    });
  }
    
  if (hasDayColumn) {
    await knex.schema.table('bibliography', table => {
      table.dropColumn('day');
    });
  }
    
  if (hasEndYearColumn) {
    await knex.schema.table('bibliography', table => {
      table.dropColumn('end_year');
    });
  }
    
  if (hasEndMonthColumn) {
    await knex.schema.table('bibliography', table => {
      table.dropColumn('end_month');
    });
  }
    
  if (hasEndDayColumn) {
    await knex.schema.table('bibliography', table => {
      table.dropColumn('end_day');
    });
  }
    
  if (!hasZotItemKeyColumn) {
    await knex.raw(
      'ALTER TABLE bibliography ADD COLUMN zot_item_key VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasShortCitColumn = await knex.schema.hasColumn(
    'bibliography',
    'short_cit'
  );

  const hasTypeColumn = await knex.schema.hasColumn(
    'bibliography',
    'type'
  );
    
  const hasYearColumn = await knex.schema.hasColumn(
    'bibliography',
    'year'
  );
    
  const hasMonthColumn = await knex.schema.hasColumn(
    'bibliography',
    'month'
  );
    
  const hasDayColumn = await knex.schema.hasColumn(
    'bibliography',
    'day'
  );
    
  const hasEndYearColumn = await knex.schema.hasColumn(
    'bibliography',
    'end_year'
  );
    
  const hasEndMonthColumn = await knex.schema.hasColumn(
    'bibliography',
    'end_month'
  );
    
  const hasEndDayColumn = await knex.schema.hasColumn(
    'bibliography',
    'end_day'
  );
    
  const hasZotItemKeyColumn = await knex.schema.hasColumn(
    'bibliography',
    'zot_item_key'
  );

  if (hasShortCitColumn) {
    await knex.schema.table('bibliography', table => {
      table.renameColumn('short_cit', 'citationFormat');
    });
  }

  if (!hasTypeColumn) {
    await knex.raw(
      'ALTER TABLE bibliography ADD COLUMN type VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid; '
    );
  }
    
  if (!hasYearColumn) {
    await knex.raw(
      'ALTER TABLE bibliography ADD COLUMN year INT(4) CHARACTER SET binary AFTER citationFormat; '
    );
  }
    
  if (!hasMonthColumn) {
    await knex.raw(
      'ALTER TABLE bibliography ADD COLUMN month INT(2) CHARACTER SET binary AFTER year; '
    );
  }
    
  if (!hasDayColumn) {
    await knex.raw(
      'ALTER TABLE bibliography ADD COLUMN day INT(2) CHARACTER SET binary AFTER month; '
    );
  }
    
  if (!hasEndYearColumn) {
    await knex.raw(
      'ALTER TABLE bibliography ADD COLUMN end_year INT(4) CHARACTER SET binary AFTER day; '
    );
  }

  if (!hasEndMonthColumn) {
    await knex.raw(
      'ALTER TABLE bibliography ADD COLUMN end_month INT(2) CHARACTER SET binary AFTER end_year; '
    );
  }

  if (!hasEndDayColumn) {
    await knex.raw(
      'ALTER TABLE bibliography ADD COLUMN end_day INT(2) CHARACTER SET binary AFTER end_month; '
    );
  }
    
  if (hasZotItemKeyColumn) {
    await knex.schema.table('bibliography', table => {
      table.dropColumn('zot_item_key');
    });
  }
}

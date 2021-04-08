import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasNameColumn = await knex.schema.hasColumn('variable', 'name');
  const hasAbbreviatioColumn = await knex.schema.hasColumn(
    'variable',
    'abbreviation'
  );

  if (!hasNameColumn) {
    await knex.raw(
      'ALTER TABLE variable ADD COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER type; '
    );
  }
  if (!hasAbbreviatioColumn) {
    await knex.raw(
      'ALTER TABLE variable ADD COLUMN abbreviation CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER name;'
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasNameColumn = await knex.schema.hasColumn('variable', 'name');
  const hasAbbreviationColumn = await knex.schema.hasColumn(
    'variable',
    'abbreviation'
  );

  if (hasNameColumn) {
    await knex.schema.table('variable', table => {
      table.dropColumn('name');
    });
  }
  if (hasAbbreviationColumn) {
    await knex.schema.table('variable', table => {
      table.dropColumn('abbreviation');
    });
  }
}

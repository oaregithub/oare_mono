import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasNameColumn = await knex.schema.hasColumn('value', 'name');
  const hasAbbreviationColumn = await knex.schema.hasColumn(
    'value',
    'abbreviation'
  );

  if (!hasNameColumn) {
    await knex.raw(
      'ALTER TABLE value ADD COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid; '
    );
  }
  if (!hasAbbreviationColumn) {
    await knex.raw(
      'ALTER TABLE value ADD COLUMN abbreviation CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER name;'
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasNameColumn = await knex.schema.hasColumn('value', 'name');
  const hasAbbreviationColumn = await knex.schema.hasColumn(
    'value',
    'abbreviation'
  );

  if (hasNameColumn) {
    await knex.schema.table('value', table => {
      table.dropColumn('name');
    });
  }
  if (hasAbbreviationColumn) {
    await knex.schema.table('value', table => {
      table.dropColumn('abbreviation');
    });
  }
}

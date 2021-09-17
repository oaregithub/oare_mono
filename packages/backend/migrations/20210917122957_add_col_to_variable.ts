import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTableReferenceColumn = await knex.schema.hasColumn('variable', 'table_reference');

  if (!hasTableReferenceColumn) {
    await knex.raw(
      'ALTER TABLE variable ADD COLUMN table_reference VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER abbreviation; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTableReferenceColumn = await knex.schema.hasColumn('variable', 'table_reference');

  if (hasTableReferenceColumn) {
    await knex.schema.table('variable', table => {
      table.dropColumn('table_reference');
    });
  }
}

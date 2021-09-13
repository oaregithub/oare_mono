import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasNameColumn = await knex.schema.hasColumn('archive', 'name');

  if (!hasNameColumn) {
    await knex.raw(
      'ALTER TABLE archive ADD COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasNameColumn = await knex.schema.hasColumn('archive', 'name');

  if (hasNameColumn) {
    await knex.schema.table('archive', table => {
      table.dropColumn('name');
    });
  }
}

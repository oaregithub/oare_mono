import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasCustomColumn = await knex.schema.hasColumn('hierarchy', 'custom');

  if (!hasCustomColumn) {
    await knex.raw('ALTER TABLE hierarchy ADD COLUMN custom INT(4); ');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasCustomColumn = await knex.schema.hasColumn('hierarchy', 'custom');

  if (hasCustomColumn) {
    await knex.schema.table('hierarchy', table => {
      table.dropColumn('custom');
    });
  }
}

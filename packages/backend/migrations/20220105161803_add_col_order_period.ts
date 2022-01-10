import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasOrderColumn = await knex.schema.hasColumn('period', 'order');

  if (!hasOrderColumn) {
    await knex.schema.table('period', table => {
      table.integer('order');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasOrderColumn = await knex.schema.hasColumn('period', 'order');

  if (hasOrderColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('order');
    });
  }
}

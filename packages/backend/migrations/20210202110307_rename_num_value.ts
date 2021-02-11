import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('text_markup', '#_value');

  if (hasColumn) {
    await knex.schema.table('text_markup', table => {
      table.renameColumn('#_value', 'num_value');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('text_markup', 'num_value');

  if (hasColumn) {
    await knex.schema.table('text_markup', table => {
      table.renameColumn('num_value', '#_value');
    });
  }
}

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumnColumn = await knex.schema.hasColumn(
    'text_epigraphy',
    '`column`'
  );
  if (hasColumnColumn) {
    await knex.schema.table('text_epigraphy', table => {
      table.dropColumn('column');
    });
    await knex.schema.table('text_epigraphy', table => {
      table.integer('col').after('side').defaultTo(1);
    });
  }
}
export async function down(knex: Knex): Promise<void> {
  const hasColColumn = await knex.schema.hasColumn('text_epigraphy', 'col');
  if (hasColColumn) {
    await knex.schema.table('text_epigraphy', table => {
      table.renameColumn('col', 'column');
    });
  }
}

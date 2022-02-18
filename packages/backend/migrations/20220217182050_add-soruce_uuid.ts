import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('field', 'source_uuid');
  if (!hasColumn) {
    await knex.schema.table('field', table => {
      table.text('source_uuid');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('field', 'source_uuid');
  if (hasColumn) {
    await knex.schema.table('field', table => {
      table.dropColumn('source_uuid');
    });
  }
}

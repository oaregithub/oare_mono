import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(
    'text_discourse',
    'obj_in_text'
  );
  if (!hasColumn) {
    await knex.schema.table('text_discourse', table => {
      table.integer('obj_in_text', 5).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(
    'text_discourse',
    'obj_in_text'
  );
  if (hasColumn) {
    await knex.schema.table('text_discourse', table => {
      table.dropColumn('obj_in_text');
    });
  }
}

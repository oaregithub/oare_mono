import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const indexName = 'idx_text_discourse_explicit_spelling';
  const rows: any[] = (
    await knex.raw('SHOW INDEX FROM text_discourse WHERE Key_name=?', indexName)
  )[0];

  if (rows.length === 0) {
    await knex.schema.table('text_discourse', table => {
      table.index('explicit_spelling', indexName);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('text_discourse', table => {
    table.dropIndex(
      'explicit_spelling',
      'idx_text_discourse_explicit_spelling'
    );
  });
}

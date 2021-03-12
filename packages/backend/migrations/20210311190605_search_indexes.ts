import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const indexName = 'idx_ep_reading_uuid_text_uuid_char_on_tablet';
  const rows: any[] = (
    await knex.raw('SHOW INDEX FROM text_epigraphy WHERE Key_name=?', indexName)
  )[0];

  if (rows.length === 0) {
    await knex.schema.table('text_epigraphy', table => {
      table.index(['reading_uuid', 'text_uuid', 'char_on_tablet'], indexName);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('text_epigraphy', table => {
    table.dropIndex(
      'text_epigraphy',
      'idx_ep_reading_uuid_text_uuid_char_on_tablet'
    );
  });
}

import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const indexName = 'idx_ep_charOnTablet_textUuid_readingUuid';
  const rows: any[] = (
    await knex.raw('SHOW INDEX FROM text_epigraphy WHERE Key_name=?', indexName)
  )[0];

  if (rows.length === 0) {
    await knex.schema.table('text_epigraphy', table => {
      table.index(['char_on_tablet', 'text_uuid', 'reading_uuid'], indexName);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('text_epigraphy', table => {
    table.dropIndex(
      'text_epigraphy',
      'idx_ep_charOnTablet_textUuid_readingUuid'
    );
  });
}

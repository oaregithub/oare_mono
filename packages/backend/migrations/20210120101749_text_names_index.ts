import * as Knex from 'knex';

const indexName = 'idx_text_name';

const hasIndex = async (knex: Knex): Promise<boolean> => {
  const rows: any[] = (
    await knex.raw('SHOW INDEX FROM text WHERE Key_name=?', indexName)
  )[0];
  return rows.length > 0;
};

export async function up(knex: Knex): Promise<void> {
  const indexExists = await hasIndex(knex);

  if (!indexExists) {
    await knex.schema.table('text', table => {
      table.index('name', indexName);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const indexExists = await hasIndex(knex);

  if (indexExists) {
    await knex.schema.table('text', table => {
      table.dropIndex('text', indexName);
    });
  }
}

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const indexName = 'idx_alias_primacy';
  const rows: any[] = (
    await knex.raw('SHOW INDEX FROM alias WHERE Key_name=?', indexName)
  )[0];

  if (rows.length === 0) {
    await knex.schema.table('alias', table => {
      table.index('primacy', indexName);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('alias', table => {
    table.dropIndex('alias', 'idx_alias_primacy');
  });
}

import { Knex } from 'knex';

const indexName = 'idx_name_uuid';
const indexRelationName = 'idx_relation_name_uuid';
export async function up(knex: Knex): Promise<void> {
  const nameRows: any[] = (
    await knex.raw('SHOW INDEX FROM person WHERE Key_name=?', indexName)
  )[0];

  if (nameRows.length === 0) {
    await knex.schema.table('person', table => {
      table.index(['name_uuid'], indexName);
    });
  }

  const relationNameRows: any[] = (
    await knex.raw('SHOW INDEX FROM person WHERE Key_name=?', indexRelationName)
  )[0];

  if (relationNameRows.length === 0) {
    await knex.schema.table('person', table => {
      table.index(['relation_name_uuid'], indexRelationName);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const nameRows: any[] = (
    await knex.raw('SHOW INDEX FROM person WHERE Key_name=?', indexName)
  )[0];

  const relationNameRows: any[] = (
    await knex.raw('SHOW INDEX FROM person WHERE Key_name=?', indexRelationName)
  )[0];

  return knex.schema.table('person', table => {
    if (nameRows.length > 0) {
      table.dropIndex('name_uuid', indexName);
    }

    if (relationNameRows.length > 0) {
      table.dropIndex('relation_name_uuid', indexRelationName);
    }
  });
}

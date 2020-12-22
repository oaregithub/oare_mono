import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('collection_group');
  if (!exists) {
    return knex.schema.createTable('collection_group', (table) => {
      table.increments('id');
      table.uuid('collection_uuid');
      table.integer('group_id');
      table.integer('can_read');
      table.integer('can_write');
    });
  }
  return undefined;
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('collection_group');
}

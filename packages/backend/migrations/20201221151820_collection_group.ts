import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('collection_group');
  if (!exists) {
    return knex.schema.createTable('collection_group', table => {
      table.increments('id');
      table.uuid('collection_uuid').notNullable();
      table.integer('group_id').notNullable();
      table.integer('can_read').notNullable();
      table.integer('can_write').notNullable();
    });
  }
  return undefined;
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('collection_group');
  if (exists) {
    return knex.schema.dropTable('collection_group');
  }
  return undefined;
}

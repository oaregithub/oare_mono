import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('public_blacklist');
  if (!exists) {
    return knex.schema.createTable('public_blacklist', table => {
      table.increments('id');
      table.uuid('uuid');
      table.string('type');
    });
  }
  return undefined;
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('public_blacklist');
}

import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('public_blacklist', (table) => {
    table.increments('id');
    table.uuid('uuid');
    table.string('type');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('public_blacklist');
}

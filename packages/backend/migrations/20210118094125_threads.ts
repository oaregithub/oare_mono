import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('threads');
  if (!exists) {
    return knex.schema.createTable('threads', (table) => {
      table.increments('id');
      table.uuid('uuid').notNullable();
      table.uuid('reference_uuid').notNullable();
      table.string('status');
      table.string('route').notNullable();
    });
  }
  return undefined;
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('threads');
  if (exists) {
    return knex.schema.dropTable('threads');
  }
  return undefined;
}

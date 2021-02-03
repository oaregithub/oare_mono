import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('threads');
  if (!exists) {
    return knex.schema.createTable('threads', (table) => {
      table.charset('utf8');
      table.collate('utf8_general_ci');
      table.increments('id');
      table.uuid('uuid').notNullable().unique();
      table.uuid('reference_uuid').notNullable();
      table.string('status').notNullable();
      table.string('route').notNullable();
    });
  }
  return undefined;
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('threads');
  if (exists) {
    await knex.schema.dropTable('threads');
  }
}

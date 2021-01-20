import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('comments');
  if (!exists) {
    return knex.schema.createTable('comments', (table) => {
      table.increments('id');
      table.uuid('uuid').notNullable();
      table.uuid('reference_uuid').notNullable();
      table.uuid('thread_uuid').notNullable();
      table.uuid('user_uuid').notNullable();
      table.dateTime('created_at').notNullable();
      table.boolean('deleted');
      table.string('comment');
    });
  }
  return undefined;
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('comments');
  if (exists) {
    return knex.schema.dropTable('comments');
  }
  return undefined;
}

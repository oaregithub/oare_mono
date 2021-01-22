import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('comments');
  if (!exists) {
    return knex.schema.createTable('comments', (table) => {
      table.increments('id');
      table.uuid('uuid').notNullable().unique();
      table.uuid('thread_uuid').notNullable();
      table.uuid('user_uuid').notNullable();
      table.dateTime('created_at').notNullable();
      table.boolean('deleted').notNullable();
      table.string('comment').notNullable();
      table.foreign('thread_uuid').references('threads.uuid');
      table.foreign('user_uuid').references('user.uuid');
    });
  }
  return undefined;
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('comments');
  if (exists) {
    await knex.schema.dropTable('comments');
  }
}

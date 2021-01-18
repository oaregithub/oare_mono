import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('comments');
  if (!exists) {
    return knex.schema.createTable('comments', (table) => {
      table.increments('id');
      table.uuid('uuid').notNullable();
      table.string('thread_uuid', 36).notNullable();
      table.string('user_uuid', 36).notNullable();
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

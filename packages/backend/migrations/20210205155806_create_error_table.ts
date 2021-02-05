import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = knex.schema.hasTable('errors');

  if (!hasTable) {
    await knex.schema.createTable('errors', (table) => {
      table.increments('id');
      table.uuid('user_uuid').nullable();
      table.text('description').notNullable();
      table.text('stacktrace').nullable();
      table.timestamp('timestamp').notNullable();
      table.string('status').notNullable();

      table.foreign('user_uuid').references('user.uuid');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('errors');
}

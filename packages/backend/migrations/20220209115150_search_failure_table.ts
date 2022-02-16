import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('search_failure');

  if (!tableExists) {
    await knex.schema.createTable('search_failure', table => {
      table.increments('id');
      table.uuid('user_uuid');
      table.string('search_type').notNullable();
      table.string('query_content').notNullable();
      table.timestamp('timestamp').notNullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('search_failure');
}

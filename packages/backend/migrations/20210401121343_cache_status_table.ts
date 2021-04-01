import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('cache_status');
  if (!hasTable) {
    await knex.schema.createTable('cache_status', table => {
      table.boolean('is_enabled');
      table.dateTime('expires');
    });

    await knex('cache_status').insert({
      is_enabled: true,
      expires: new Date(),
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cache_status');
}

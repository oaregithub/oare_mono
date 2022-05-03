import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('cache_status');
  if (!hasTable) {
    await knex.schema.createTable('cache_status', table => {
      table.dateTime('disable_expires');
    });

    await knex('cache_status').insert({
      disable_expires: new Date(),
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cache_status');
}

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('person_text_occurrences');
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('person_text_occurrences');

  if (!hasTable) {
    await knex.schema.createTable('person_text_occurrences', table => {
      table.increments('id');
      table.uuid('uuid');
      table.uuid('person_uuid');
      table.integer('count');
      table.integer('distinct_count');
    });
  }
}

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasEventTable = await knex.schema.hasTable('event');

  if (!hasEventTable) {
    await knex.schema.createTable('event', table => {
      table.charset('utf8');
      table.collate('utf8_general_ci');
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.uuid('parent_uuid').nullable();
      table.string('name', 255);
      table.integer('event_ser_no').notNullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasEventTable = await knex.schema.hasTable('event');

  if (hasEventTable) {
    await knex.schema.dropTable('event');
  }
}

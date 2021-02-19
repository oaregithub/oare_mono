import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('errors', table => {
    table.dateTime('timestamp').notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('errors', table => {
    table.timestamp('timestamp').notNullable().alter();
  });
}

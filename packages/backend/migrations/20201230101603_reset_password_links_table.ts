import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('reset_password_links');

  if (!hasTable) {
    await knex.schema.createTable('reset_password_links', (table) => {
      table.charset('utf8');
      table.collate('utf8_general_ci');
      table.uuid('uuid').primary().notNullable();
      table.uuid('user_uuid').notNullable();
      table.timestamp('expiration').notNullable();

      table.foreign('user_uuid').references('user.uuid');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('reset_password_links');
}

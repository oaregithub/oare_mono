import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasEventTable = await knex.schema.hasTable('sign_sibling');

  if (!hasEventTable) {
    await knex.schema.createTable('sign_sibling', table => {
      table.charset('utf8');
      table.collate('utf8_general_ci');
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.uuid('sign_uuid').notNullable().unique();
      table.uuid('sibling_uuid').notNullable().unique();
      table.integer('gestalt').nullable();
      table.integer('leading').nullable();
      table.integer('trailing').nullable();
      table.integer('upper').nullable();
      table.integer('lower').nullable();
      table.integer('mid').nullable();
      table.integer('component').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasEventTable = await knex.schema.hasTable('sign_sibling');

  if (hasEventTable) {
    await knex.schema.dropTable('sign_sibling');
  }
}

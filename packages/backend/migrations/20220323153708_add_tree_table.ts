import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTreeTable = await knex.schema.hasTable('tree');
  if (!hasTreeTable) {
    await knex.schema.createTable('tree', table => {
      table.charset('utf8mb4');
      table.collate('utf8mb4_bin');
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('type', 6);
    });
  }
}
export async function down(knex: Knex): Promise<void> {
  const hasTreeTable = await knex.schema.hasTable('tree');
  if (hasTreeTable) {
    await knex.schema.dropTable('tree');
  }
}

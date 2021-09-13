import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasAssetTable = await knex.schema.hasTable('asset');

  if (!hasAssetTable) {
    await knex.schema.createTable('asset', table => {
      table.charset('utf8');
      table.collate('utf8_general_ci');
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.uuid('prim_archive').nullable();
      table.integer('asset_ser_no').notNullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasAssetTable = await knex.schema.hasTable('asset');

  if (hasAssetTable) {
    await knex.schema.dropTable('asset');
  }
}

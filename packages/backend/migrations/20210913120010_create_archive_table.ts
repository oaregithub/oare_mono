import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasArchiveTable = await knex.schema.hasTable('archive');

  if (!hasArchiveTable) {
    await knex.schema.createTable('archive', table => {
      table.charset('utf8');
      table.collate('utf8_general_ci');
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.uuid('owner').nullable();
      table.uuid('current_editor').nullable();
      table.uuid('arch_locus').nullable();
      table.string('type', 13).notNullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasArchiveTable = await knex.schema.hasTable('archive');

  if (hasArchiveTable) {
    await knex.schema.dropTable('archive');
  }
}

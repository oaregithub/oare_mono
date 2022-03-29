import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasEditorCreditTable = await knex.schema.hasTable('editor_credit');
  if (!hasEditorCreditTable) {
    await knex.schema.createTable('editor_credit', table => {
      table.charset('utf8');
      table.collate('utf8_general_ci');
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.uuid('user_uuid').notNullable().unique();
      table.uuid('object_uuid').notNullable().unique();
      table.string('edit_type', 6);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasEditorCreditTable = await knex.schema.hasTable('editor_credit');
  if (hasEditorCreditTable) {
    await knex.schema.dropTable('editor_credit');
  }
}

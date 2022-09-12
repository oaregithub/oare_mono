import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasLoggingEditsTable = await knex.schema.hasTable('logging_edits');

  if (hasLoggingEditsTable) {
    const currentRows = await knex('logging_edits').select('*');
    if (currentRows.length > 0) {
      await knex('logging').insert(currentRows);
    }

    await knex.schema.dropTable('logging_edits');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasLoggingEditsTable = await knex.schema.hasTable('logging_edits');

  if (!hasLoggingEditsTable) {
    await knex.schema.createTable('logging_edits', table => {
      table.increments('id').primary();
      table.string('type').notNullable();
      table.uuid('user_uuid').notNullable();
      table.datetime('time').notNullable();
      table.string('reference_table').notNullable();
      table.uuid('uuid').notNullable();
      table.text('object_values');
    });
  }
}

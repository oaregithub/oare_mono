import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasQuarantineTextTable = await knex.schema.hasTable('quarantine_text');

  if (!hasQuarantineTextTable) {
    await knex.schema.createTable('quarantine_text', table => {
      table.increments('id').primary();
      table
        .uuid('reference_uuid')
        .notNullable()
        .unique()
        // @ts-ignore
        .collate('latin1_swedish_ci');
      table.dateTime('timestamp').notNullable();

      table.foreign('reference_uuid').references('text.uuid');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('quarantine_text');
}

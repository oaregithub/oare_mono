import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('search_index');
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('search_index');
  if (hasTable) {
    return;
  }
  await knex.schema.createTable('search_index', table => {
    table.increments('id');
    table.string('sign_uuid_sequence', 1332);
    table.uuid('text_uuid');
    table.string('text_name');
    table.decimal('line');
    table.text('line_reading');

    table.foreign('text_uuid').references('text.uuid');
  });

  // Index keys will be too long if every column is utf8, so just change line_reading
  await knex.raw(
    'ALTER TABLE search_index MODIFY line_reading TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin'
  );
}

import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTreeTable = await knex.schema.hasTable('tree');
  if (!hasTreeTable) {
    await knex.schema.createTable('tree', table => {
      table.charset('utf8mb4');
      table.collate('utf8mb4_bin');
      table.increments('id').primary();
      table
        .uuid('uuid')
        .notNullable()
        .unique()
        .references('uuid')
        .inTable('uuid');
      table.string('type', 6);
    });
  }
  const hasFKepigraphy = await knex.schema.hasColumn(
    'text_epigraphy',
    'tree_uuid'
  );
  if (hasFKepigraphy) {
    await knex.schema.alterTable('text_epigraphy', table => {
      table.foreign('tree_uuid').references('uuid').inTable('uuid');
    });
  }
  const hasFKdiscourse = await knex.schema.hasColumn(
    'text_discourse',
    'tree_uuid'
  );
  if (hasFKdiscourse) {
    await knex.schema.alterTable('text_discourse', table => {
      table.foreign('tree_uuid').references('uuid').inTable('uuid');
    });
  }
}
export async function down(knex: Knex): Promise<void> {
  const hasFKepigraphy = await knex.schema.hasColumn(
    'text_epigraphy',
    'tree_uuid'
  );
  if (hasFKepigraphy) {
    await knex.schema.alterTable('text_epigraphy', table => {
      table.dropForeign(['tree_uuid']);
    });
  }
  const hasFKdiscourse = await knex.schema.hasColumn(
    'text_discourse',
    'tree_uuid'
  );
  if (hasFKdiscourse) {
    await knex.schema.alterTable('text_discourse', table => {
      table.dropForeign(['tree_uuid']);
    });
  }

  const hasTreeTable = await knex.schema.hasTable('tree');
  if (hasTreeTable) {
    await knex.schema.dropTable('tree');
  }
}

import * as Knex from 'knex';

const epigraphyTreeFK = 'epigraphy_tree_uuid_foreign';
const discourseTreeFK = 'discourse_tree_uuid_foreign';

export async function up(knex: Knex): Promise<void> {
  const hasTreeTable = await knex.schema.hasTable('tree');
  if (!hasTreeTable) {
    await knex.schema.createTable('tree', table => {
      table.charset('utf8mb4');
      table.collate('utf8mb4_bin');
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('type', 6);

      table.foreign('uuid', 'tree_uuid_fk_uuid').references('uuid.uuid');
    });
  }

  await knex.schema.alterTable('text_epigraphy', table => {
    table.foreign('tree_uuid', epigraphyTreeFK).references('tree.uuid');
  });

  await knex.schema.alterTable('text_discourse', table => {
    table.foreign('tree_uuid', discourseTreeFK).references('tree.uuid');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('text_epigraphy', table => {
    table.dropForeign(['tree_uuid'], epigraphyTreeFK);
  });

  await knex.schema.alterTable('text_discourse', table => {
    table.dropForeign(['tree_uuid'], discourseTreeFK);
  });

  const hasTreeTable = await knex.schema.hasTable('tree');
  if (hasTreeTable) {
    await knex.schema.dropTable('tree');
  }
}

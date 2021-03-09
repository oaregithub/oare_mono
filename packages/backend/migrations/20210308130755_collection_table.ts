import * as Knex from 'knex';

const fkName = 'collection_uuid_foreign';
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('collection');
  if (!hasTable) {
    await knex.schema.createTable('collection', table => {
      table.increments('id');
      table.uuid('uuid').notNullable().unique();
      table.string('name').notNullable();

      table
        .foreign('uuid', fkName)
        .references('hierarchy.uuid')
        .onDelete('CASCADE');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('collection');
}

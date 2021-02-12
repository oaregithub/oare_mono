import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('threads');

  if (hasTable) {
    await knex.schema.table('threads', table => {
      table.string('name');
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('threads');

  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('threads', 'name');
    if (hasColumn) {
      await knex.schema.table('threads', table => {
        table.dropColumn('name')
      })
    }
  }
}


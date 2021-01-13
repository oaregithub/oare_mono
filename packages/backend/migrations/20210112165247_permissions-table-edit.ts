import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasOldName = await knex.schema.hasColumn('permissions', 'user_uuid');
  if (hasOldName) {
    await knex.schema.table('permissions', (table) => table.renameColumn('user_uuid', 'group_id'));
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasNewName = await knex.schema.hasColumn('permissions', 'group_id');
  if (hasNewName) {
    await knex.schema.table('permissions', (table) => table.renameColumn('group_id', 'user_uuid'));
  }
}

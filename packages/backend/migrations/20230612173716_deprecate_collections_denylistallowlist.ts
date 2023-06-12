import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('public_denylist').where({ type: 'collection' }).del();
  await knex('group_allowlist').where({ type: 'collection' }).del();

  const hasColumn = await knex.schema.hasColumn(
    'group_edit_permissions',
    'type'
  );
  if (hasColumn) {
    await knex('group_edit_permissions').where({ type: 'collection' }).del();

    await knex.schema.table('group_edit_permissions', table => {
      table.dropColumn('type');
      table.foreign('uuid').references('text.uuid');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(
    'group_edit_permissions',
    'type'
  );
  if (!hasColumn) {
    await knex.schema.table('group_edit_permissions', table => {
      table.string('type').notNullable();
    });

    await knex('group_edit_permissions').update({ type: 'text' });
  }
}

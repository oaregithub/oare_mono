import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Get existing text allowlist
  const textAllowlist = await knex('text_group')
    .select('text_uuid AS uuid', 'group_id')
    .where('can_read', 1);

  // Get existing collection allowlist
  const collectionAllowlist = await knex('collection_group')
    .select('collection_uuid AS uuid', 'group_id')
    .where('can_read', 1);

  // Get existing text edit permissions
  const textEdits = await knex('text_group')
    .select('text_uuid AS uuid', 'group_id')
    .where('can_write', 1);

  // Get existing collection edit permissions
  const collectionEdits = await knex('collection_group')
    .select('collection_uuid AS uuid', 'group_id')
    .where('can_write', 1);

  // Check if group_allowlist table exists
  const hasGroupAllowlistTable = await knex.schema.hasTable('group_allowlist');

  // Create group_allowlist table
  if (!hasGroupAllowlistTable) {
    await knex.schema.createTable('group_allowlist', table => {
      table.increments('id');
      table.uuid('uuid').notNullable();
      table.integer('group_id').notNullable();
      table.string('type').notNullable();
      table
        .foreign('group_id', 'oare_group_allowlist_fk')
        .references('oare_group.id');
    });

    await Promise.all(
      textAllowlist.map(text =>
        knex('group_allowlist').insert({
          uuid: text.uuid,
          group_id: text.group_id,
          type: 'text',
        })
      )
    );
    await Promise.all(
      collectionAllowlist.map(collection =>
        knex('group_allowlist').insert({
          uuid: collection.uuid,
          group_id: collection.group_id,
          type: 'collection',
        })
      )
    );
  }

  // Check if group_edit_permissions table exists
  const hasGroupEditPermissionsTable = await knex.schema.hasTable(
    'group_edit_permissions'
  );

  // Create group_edit_permissions table
  if (!hasGroupEditPermissionsTable) {
    await knex.schema.createTable('group_edit_permissions', table => {
      table.increments('id');
      table.uuid('uuid').notNullable();
      table.integer('group_id').notNullable();
      table.string('type').notNullable();
      table
        .foreign('group_id', 'oare_group_edit_fk')
        .references('oare_group.id');
    });

    await Promise.all(
      textEdits.map(text =>
        knex('group_edit_permissions').insert({
          uuid: text.uuid,
          group_id: text.group_id,
          type: 'text',
        })
      )
    );
    await Promise.all(
      collectionEdits.map(collection =>
        knex('group_edit_permissions').insert({
          uuid: collection.uuid,
          group_id: collection.group_id,
          type: 'collection',
        })
      )
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop group_allowlist table
  await knex.schema.dropTableIfExists('group_allowlist');

  // Drop group_edit_permissions table
  await knex.schema.dropTableIfExists('group_edit_permissions');
}

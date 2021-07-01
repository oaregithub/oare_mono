import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('text_group');
  await knex.schema.dropTableIfExists('collection_group');
}

export async function down(knex: Knex): Promise<void> {
  const hasEditPermission = async (
    uuid: string,
    groupId: number,
    type: 'text' | 'collection'
  ): Promise<boolean> => {
    const row = await knex('group_edit_permissions')
      .where({ uuid })
      .andWhere('group_id', groupId)
      .andWhere({ type });
    return !!row;
  };

  // TextGroup
  const hasTextGroupTable = await knex.schema.hasTable('text_group');
  if (!hasTextGroupTable) {
    await knex.schema.createTable('text_group', table => {
      table.increments('id');
      table.uuid('text_uuid').notNullable();
      table.integer('group_id').notNullable();
      table.integer('can_read').notNullable();
      table.integer('can_write').notNullable();
    });

    const textAllowlist = await knex('group_allowlist')
      .select('uuid', 'group_id AS groupId')
      .where('type', 'text');
    const textEditPermissions = await Promise.all(
      textAllowlist.map(text =>
        hasEditPermission(text.uuid, text.groupId, 'text')
      )
    );
    const textInsertRows = textAllowlist.map((text, index) => ({
      text_uuid: text.uuid,
      group_id: text.groupId,
      can_read: true,
      can_write: textEditPermissions[index],
    }));
    const otherTextEditPermissions = await knex('group_edit_permissions')
      .select('uuid', 'group_id AS groupId')
      .where('type', 'text')
      .whereNotIn(
        'uuid',
        textAllowlist.map(text => text.uuid)
      );
    otherTextEditPermissions.forEach(text =>
      textInsertRows.push({
        text_uuid: text.uuid,
        group_id: text.groupId,
        can_read: false,
        can_write: true,
      })
    );
    await knex('text_group').insert(textInsertRows);
  }

  // CollectionGroup
  const hasCollectionGroupTable = await knex.schema.hasTable(
    'collection_group'
  );
  if (!hasCollectionGroupTable) {
    await knex.schema.createTable('collection_group', table => {
      table.increments('id');
      table.uuid('collection_uuid').notNullable();
      table.integer('group_id').notNullable();
      table.integer('can_read').notNullable();
      table.integer('can_write').notNullable();
    });

    const collectionAllowlist = await knex('group_allowlist')
      .select('uuid', 'group_id AS groupId')
      .where('type', 'collection');
    const collectionEditPermissions = await Promise.all(
      collectionAllowlist.map(collection =>
        hasEditPermission(collection.uuid, collection.groupId, 'collection')
      )
    );
    const collectionInsertRows = collectionAllowlist.map(
      (collection, index) => ({
        collection_uuid: collection.uuid,
        group_id: collection.groupId,
        can_read: true,
        can_write: collectionEditPermissions[index],
      })
    );
    const otherCollectionEditPermissions = await knex('group_edit_permissions')
      .select('uuid', 'group_id AS groupId')
      .where('type', 'collection')
      .whereNotIn(
        'uuid',
        collectionAllowlist.map(collection => collection.uuid)
      );
    otherCollectionEditPermissions.forEach(collection =>
      collectionInsertRows.push({
        collection_uuid: collection.uuid,
        group_id: collection.groupId,
        can_read: false,
        can_write: true,
      })
    );
    await knex('collection_group').insert(collectionInsertRows);
  }
}

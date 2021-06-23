import * as Knex from 'knex';

const collectionForeignKey = 'collection_uuid_foreign';
const hierarchyForeignKey2 = 'hierarchy_ibfk_2';
const hierarchyForeignKey1 = 'hierarchy_ibfk_1';

export async function up(knex: Knex): Promise<void> {
  // Drop foreign keys
  const collectionFKExists =
    (
      await knex('information_schema.REFERENTIAL_CONSTRAINTS')
        .where('CONSTRAINT_NAME', collectionForeignKey)
        .andWhere('TABLE_NAME', 'collection')
    ).length > 0;
  if (collectionFKExists) {
    await knex.schema.table('collection', table => {
      table.dropForeign(['uuid'], collectionForeignKey);
    });
  }

  const hierarchyFK2Exists =
    (
      await knex('information_schema.REFERENTIAL_CONSTRAINTS')
        .where('CONSTRAINT_NAME', hierarchyForeignKey2)
        .andWhere('TABLE_NAME', 'hierarchy')
    ).length > 0;
  if (hierarchyFK2Exists) {
    await knex.schema.table('hierarchy', table => {
      table.dropForeign(['parent_uuid'], hierarchyForeignKey2);
    });
  }

  const hierarchyFK1Exists =
    (
      await knex('information_schema.REFERENTIAL_CONSTRAINTS')
        .where('CONSTRAINT_NAME', hierarchyForeignKey1)
        .andWhere('TABLE_NAME', 'hierarchy')
    ).length > 0;
  if (hierarchyFK1Exists) {
    await knex.schema.table('hierarchy', table => {
      table.dropForeign(['uuid'], hierarchyForeignKey1);
    });
  }

  // Rename columns if exist
  const hasUuidColumn = await knex.schema.hasColumn('hierarchy', 'uuid');
  if (hasUuidColumn) {
    await knex.schema.table('hierarchy', table => {
      table.renameColumn('uuid', 'object_uuid');
    });
  }

  const hasParentUuidColumn = await knex.schema.hasColumn(
    'hierarchy',
    'parent_uuid'
  );
  if (hasParentUuidColumn) {
    await knex.schema.table('hierarchy', table => {
      table.renameColumn('parent_uuid', 'obj_parent_uuid');
    });
  }

  const hasHierarchyUuidColumn = await knex.schema.hasColumn(
    'hierarchy',
    'hierarchy_uuid'
  );
  if (hasHierarchyUuidColumn) {
    await knex.schema.table('hierarchy', table => {
      table.renameColumn('hierarchy_uuid', 'uuid');
    });
  }

  const hasHierarchyParentUuidColumn = await knex.schema.hasColumn(
    'hierarchy',
    'hierarchy_parent_uuid'
  );
  if (hasHierarchyParentUuidColumn) {
    await knex.schema.table('hierarchy', table => {
      table.renameColumn('hierarchy_parent_uuid', 'parent_uuid');
    });
  }

  // Reorder columns
  await knex.raw('ALTER TABLE hierarchy MODIFY uuid char(36) AFTER id');
  await knex.raw(
    'ALTER TABLE hierarchy MODIFY parent_uuid char(36) AFTER uuid'
  );
  await knex.raw(
    'ALTER TABLE hierarchy MODIFY object_uuid char(36) AFTER role'
  );
  await knex.raw(
    'ALTER TABLE hierarchy MODIFY obj_parent_uuid char(36) AFTER object_uuid'
  );

  // Re-add foreign keys
  await knex.schema.table('collection', table => {
    table
      .foreign('uuid', collectionForeignKey)
      .references('hierarchy.object_uuid');
  });
  await knex.schema.table('hierarchy', table => {
    table.foreign('object_uuid', hierarchyForeignKey1).references('uuid.uuid');
  });
  await knex.schema.table('hierarchy', table => {
    table
      .foreign('obj_parent_uuid', hierarchyForeignKey2)
      .references('hierarchy.object_uuid');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove foreign keys
  const collectionFKExists =
    (
      await knex('information_schema.REFERENTIAL_CONSTRAINTS')
        .where('CONSTRAINT_NAME', collectionForeignKey)
        .andWhere('TABLE_NAME', 'collection')
    ).length > 0;
  if (collectionFKExists) {
    await knex.schema.table('collection', table => {
      table.dropForeign(['uuid'], collectionForeignKey);
    });
  }

  const hierarchyFK2Exists =
    (
      await knex('information_schema.REFERENTIAL_CONSTRAINTS')
        .where('CONSTRAINT_NAME', hierarchyForeignKey2)
        .andWhere('TABLE_NAME', 'hierarchy')
    ).length > 0;
  if (hierarchyFK2Exists) {
    await knex.schema.table('hierarchy', table => {
      table.dropForeign(['obj_parent_uuid'], hierarchyForeignKey2);
    });
  }

  const hierarchyFK1Exists =
    (
      await knex('information_schema.REFERENTIAL_CONSTRAINTS')
        .where('CONSTRAINT_NAME', hierarchyForeignKey1)
        .andWhere('TABLE_NAME', 'hierarchy')
    ).length > 0;
  if (hierarchyFK1Exists) {
    await knex.schema.table('hierarchy', table => {
      table.dropForeign(['object_uuid'], hierarchyForeignKey1);
    });
  }

  // Rename columns if exist
  const hasParentUuidColumn = await knex.schema.hasColumn(
    'hierarchy',
    'parent_uuid'
  );
  if (hasParentUuidColumn) {
    await knex.schema.table('hierarchy', table => {
      table.renameColumn('parent_uuid', 'hierarchy_parent_uuid');
    });
  }

  const hasUuidColumn = await knex.schema.hasColumn('hierarchy', 'uuid');
  if (hasUuidColumn) {
    await knex.schema.table('hierarchy', table => {
      table.renameColumn('uuid', 'hierarchy_uuid');
    });
  }

  const hasObjParentUuidColumn = await knex.schema.hasColumn(
    'hierarchy',
    'obj_parent_uuid'
  );
  if (hasObjParentUuidColumn) {
    await knex.schema.table('hierarchy', table => {
      table.renameColumn('obj_parent_uuid', 'parent_uuid');
    });
  }

  const hasObjectUuidColumn = await knex.schema.hasColumn(
    'hierarchy',
    'object_uuid'
  );
  if (hasObjectUuidColumn) {
    await knex.schema.table('hierarchy', table => {
      table.renameColumn('object_uuid', 'uuid');
    });
  }

  // Reorder columns
  await knex.raw('ALTER TABLE hierarchy MODIFY uuid char(36) AFTER id');
  await knex.raw(
    'ALTER TABLE hierarchy MODIFY parent_uuid char(36) AFTER type'
  );
  await knex.raw(
    'ALTER TABLE hierarchy MODIFY hierarchy_uuid char(36) AFTER published'
  );
  await knex.raw(
    'ALTER TABLE hierarchy MODIFY hierarchy_parent_uuid char(36) AFTER hierarchy_uuid'
  );

  // Re-add foreign keys
  await knex.schema.table('collection', table => {
    table.foreign('uuid', collectionForeignKey).references('hierarchy.uuid');
  });
  await knex.schema.table('hierarchy', table => {
    table.foreign('uuid', hierarchyForeignKey1).references('uuid.uuid');
  });
  await knex.schema.table('hierarchy', table => {
    table
      .foreign('parent_uuid', hierarchyForeignKey2)
      .references('hierarchy.uuid');
  });
}

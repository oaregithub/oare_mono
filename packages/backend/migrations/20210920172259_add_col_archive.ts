import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasParentUuidColumn = await knex.schema.hasColumn(
    'archive',
    'parent_uuid'
  );

  if (!hasParentUuidColumn) {
    await knex.raw(
      'ALTER TABLE archive ADD COLUMN parent_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasParentUuidColumn = await knex.schema.hasColumn(
    'archive',
    'parent_uuid'
  );

  if (hasParentUuidColumn) {
    await knex.schema.table('archive', table => {
      table.dropColumn('parent_uuid');
    });
  }
}

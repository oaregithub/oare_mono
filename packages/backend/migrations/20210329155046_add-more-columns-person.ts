import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasRelationColumn = await knex.schema.hasColumn('person', 'relation');
  const hasRelationNameUuidColumn = await knex.schema.hasColumn(
    'person',
    'relation_name_uuid'
  );

  if (!hasRelationColumn) {
    await knex.raw(
      'ALTER TABLE person ADD COLUMN relation VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER name_uuid; '
    );
  }
  if (!hasRelationNameUuidColumn) {
    await knex.raw(
      'ALTER TABLE person ADD COLUMN relation_name_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER relation;'
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasRelationColumn = await knex.schema.hasColumn('person', 'relation');
  const hasRelationNameUuidColumn = await knex.schema.hasColumn(
    'person',
    'relation_name_uuid'
  );

  if (hasRelationColumn) {
    await knex.schema.table('person', table => {
      table.dropColumn('relation');
    });
  }
  if (hasRelationNameUuidColumn) {
    await knex.schema.table('person', table => {
      table.dropColumn('relation_name_uuid');
    });
  }
}

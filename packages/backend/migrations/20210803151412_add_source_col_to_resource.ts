import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasSourceColumn = await knex.schema.hasColumn(
    'resource',
    'source_uuid'
  );

  if (!hasSourceColumn) {
    await knex.raw(
      'ALTER TABLE resource ADD COLUMN source_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasSourceColumn = await knex.schema.hasColumn(
    'resource',
    'source_uuid'
  );

  if (hasSourceColumn) {
    await knex.schema.table('resource', table => {
      table.dropColumn('source_uuid');
    });
  }
}

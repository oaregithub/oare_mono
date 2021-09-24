import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTypeColumn = await knex.schema.hasColumn('spatial_unit', 'type');

  const hasTreeAbbColumn = await knex.schema.hasColumn(
    'spatial_unit',
    'tree_abb'
  );

  if (!hasTypeColumn) {
    await knex.raw(
      'ALTER TABLE spatial_unit ADD COLUMN type VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid; '
    );
  }

  if (!hasTreeAbbColumn) {
    await knex.raw(
      'ALTER TABLE spatial_unit ADD COLUMN tree_abb VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER type; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTypeColumn = await knex.schema.hasColumn('spatial_unit', 'type');

  const hasTreeAbbColumn = await knex.schema.hasColumn(
    'spatial_unit',
    'tree_abb'
  );

  if (hasTypeColumn) {
    await knex.schema.table('spatial_unit', table => {
      table.dropColumn('type');
    });
  }

  if (hasTreeAbbColumn) {
    await knex.schema.table('spatial_unit', table => {
      table.dropColumn('tree_abb');
    });
  }
}

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasNameUuidColumn = await knex.schema.hasColumn('person', 'name_uuid');
  const hasLabelColumn = await knex.schema.hasColumn('person', 'label');

  if (!hasNameUuidColumn) {
    await knex.raw(
      'ALTER TABLE person ADD COLUMN name_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid;'
    );
  }
  if (!hasLabelColumn) {
    await knex.raw(
      'ALTER TABLE person ADD COLUMN label VARCHAR(225) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER name_uuid;'
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasNameUuidColumn = await knex.schema.hasColumn('person', 'name_uuid');
  const hasLabelColumn = await knex.schema.hasColumn('person', 'label');

  if (hasNameUuidColumn) {
    await knex.schema.table('person', table => {
      table.dropColumn('name_uuid');
    });
  }
  if (hasLabelColumn) {
    await knex.schema.table('person', table => {
      table.dropColumn('label');
    });
  }
}

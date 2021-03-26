import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('person', 'pn_uuid');
  const hasColumn2 = await knex.schema.hasColumn('person', 'label');

  if (!hasColumn) {
    await knex.raw(
      'ALTER TABLE person ADD COLUMN pn_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid;'
    );
  }
    if (!hasColumn2) {
    await knex.raw(
      'ALTER TABLE person ADD COLUMN label VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER uuid;'
    );
    }
}

export async function down(knex: Knex): Promise<void> {
    const hasColumn = await knex.schema.hasColumn('person', 'pn_uuid');
    const hasColumn2 = await knex.schema.hasColumn('person', 'label');

  if (hasColumn2) {
    await knex.schema.table('person', table => {
      table.dropColumn('pn_uuid');
    });
  }
    if (hasColumn2) {
    await knex.schema.table('person', table => {
      table.dropColumn('label');
    });
  }
}
import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('sign_reading', 'num_name');

  if (!hasColumn) {
    await knex.raw(
      'ALTER TABLE sign_reading ADD COLUMN num_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER type;'
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('sign_reading', 'num_name');

  if (hasColumn) {
    await knex.schema.table('sign_reading', table => {
      table.dropColumn('num_name');
    });
  }
}

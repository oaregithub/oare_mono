import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasSourceColumn = await knex.schema.hasColumn('sign', 'font_code');

  if (!hasSourceColumn) {
    await knex.raw(
      'ALTER TABLE sign ADD COLUMN source_uuid CHAR(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER name; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasSourceColumn = await knex.schema.hasColumn('sign', 'font_code');

  if (hasSourceColumn) {
    await knex.schema.table('sign', table => {
      table.dropColumn('font_code');
    });
  }
}

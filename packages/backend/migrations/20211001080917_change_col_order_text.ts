import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasMuseumNoColumn = await knex.schema.hasColumn('text', 'museum_no');

  if (hasMuseumNoColumn) {
    await knex.raw(
      'ALTER TABLE text MODIFY museum_no VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER museum_prfx; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasMusuemNoColumn = await knex.schema.hasColumn('text', 'museum_no');

  if (hasMusuemNoColumn) {
    await knex.raw(
      'ALTER TABLE text MODIFY museum_no VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER subgenre; '
    );
  }
}

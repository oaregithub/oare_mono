import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasHasPngColumn = await knex.schema.hasColumn('sign_org', 'has_png');

  if (!hasHasPngColumn) {
    await knex.raw(
      'ALTER TABLE sign_org ADD COLUMN has_png INT(1) AFTER org_num; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasHasPngColumn = await knex.schema.hasColumn('sign_org', 'has_png');

  if (hasHasPngColumn) {
    await knex.schema.table('sign_org', table => {
      table.dropColumn('has_png');
    });
  }
}

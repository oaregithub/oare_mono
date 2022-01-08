import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasLinkConfigColumn = await knex.schema.hasColumn(
    'variable',
    'link_config'
  );

  if (!hasLinkConfigColumn) {
    await knex.raw('ALTER TABLE variable ADD COLUMN link_config CHAR(36); ');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasLinkConfigColumn = await knex.schema.hasColumn(
    'variable',
    'link_config'
  );

  if (hasLinkConfigColumn) {
    await knex.schema.table('variable', table => {
      table.dropColumn('link_config');
    });
  }
}

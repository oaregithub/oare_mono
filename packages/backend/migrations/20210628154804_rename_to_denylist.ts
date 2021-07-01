import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasPublicBlacklistTable = await knex.schema.hasTable(
    'public_blacklist'
  );

  if (hasPublicBlacklistTable) {
    await knex.schema.renameTable('public_blacklist', 'public_denylist');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasPublicDenylistTable = await knex.schema.hasTable('public_denylist');

  if (hasPublicDenylistTable) {
    await knex.schema.renameTable('public_denylist', 'public_blacklist');
  }
}

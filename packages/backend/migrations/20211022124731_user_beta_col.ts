import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasBetaColumn = await knex.schema.hasColumn('user', 'beta_access');

  if (!hasBetaColumn) {
    await knex.schema.table('user', table => {
      table.boolean('beta_access');
    });

    await knex('user').update({
      beta_access: false,
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasBetaColumn = await knex.schema.hasColumn('user', 'beta_access');

  if (hasBetaColumn) {
    await knex.schema.table('user', table => {
      table.dropColumn('beta_access');
    });
  }
}

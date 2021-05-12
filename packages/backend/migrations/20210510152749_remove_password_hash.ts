import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('user', 'password_hash');

  if (hasColumn) {
    await knex.schema.table('user', table => {
      table.dropColumn('password_hash');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('user', 'password_hash');

  if (!hasColumn) {
    await knex.schema.table('user', table => {
      table.string('password_hash', 256).after('email');
    });
  }
}

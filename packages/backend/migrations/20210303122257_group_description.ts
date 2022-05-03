import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('oare_group', 'description');

  if (!hasColumn) {
    await knex.schema.table('oare_group', table => {
      table.string('description').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('oare_group', 'description');

  if (hasColumn) {
    await knex.schema.table('oare_group', table => {
      table.dropColumn('description');
    });
  }
}

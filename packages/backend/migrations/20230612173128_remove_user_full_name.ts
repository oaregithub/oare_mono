import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('user', 'full_name');

  if (hasColumn) {
    await knex.schema.table('user', table => {
      table.dropColumn('full_name');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('user', 'full_name');

  if (!hasColumn) {
    await knex.schema.table('user', table => {
      table.string('full_name');
    });

    const rows = await knex('user').select('uuid', 'first_name', 'last_name');

    await Promise.all(
      rows.map(({ uuid, first_name, last_name }) =>
        knex('user')
          .update({
            full_name: `${first_name} ${last_name}`,
          })
          .where({ uuid })
      )
    );
  }
}

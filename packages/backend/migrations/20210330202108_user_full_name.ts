import { Knex } from 'knex';

interface UserRow {
  uuid: string;
  firstName: string;
  lastName: string;
}

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('user', 'full_name');
  if (!hasColumn) {
    await knex.schema.table('user', table => {
      table.string('full_name');
    });

    const rows: UserRow[] = await knex('user').select(
      'uuid',
      'first_name AS firstName',
      'last_name AS lastName'
    );

    await Promise.all(
      rows.map(({ uuid, firstName, lastName }) =>
        knex('user')
          .update({
            full_name: `${firstName} ${lastName}`,
          })
          .where({ uuid })
      )
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('user', 'full_name');
  if (hasColumn) {
    await knex.schema.table('user', table => {
      table.dropColumn('full_name');
    });
  }
}

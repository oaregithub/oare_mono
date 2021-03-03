import * as Knex from 'knex';

interface GroupRow {
  id: number;
  userId: number;
}

const getUserUuid = async (knex: Knex, userId: number): Promise<string> => {
  const row: { uuid: string } = await knex('user')
    .select('uuid')
    .where('id', userId)
    .first();
  return row.uuid;
};

const fkName = 'user_group_user_uuid_foreign';
export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE user_group CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci'
  );
  const hasColumn = await knex.schema.hasColumn('user_group', 'user_uuid');
  if (!hasColumn) {
    await knex.schema.table('user_group', table => {
      table.uuid('user_uuid');
    });

    const groupRows: GroupRow[] = await knex('user_group').select(
      'id',
      'user_id AS userId'
    );

    // Insert user UUIDs
    await Promise.all(
      groupRows.map(async ({ id, userId }) => {
        const userUuid = await getUserUuid(knex, userId);
        await knex('user_group').update('user_uuid', userUuid).where({ id });
      })
    );

    await knex.raw('ALTER TABLE user_group MODIFY user_uuid CHAR(36) NOT NULL');
    await knex.schema.table('user_group', table => {
      table
        .foreign('user_uuid', fkName)
        .references('user.uuid')
        .onDelete('CASCADE');
      table.dropForeign(['user_id'], 'user_group_ibfk_2');
    });
    await knex.raw('ALTER TABLE user_group MODIFY user_id INT(11) NULL');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('user_group', 'user_uuid');
  if (hasColumn) {
    await knex.schema.table('user_group', table => {
      table.dropForeign(['user_uuid'], fkName);
      table.dropColumn('user_uuid');
      table.foreign('user_id', 'user_group_ibfk_2').references('user.id');
    });
  }
}

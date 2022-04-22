import { Knex } from 'knex';

interface DraftRow {
  id: number;
  creator: number;
}

const getUserUuid = async (knex: Knex, creator: number): Promise<string> => {
  const row: { uuid: string } = await knex('user')
    .select('uuid')
    .where('id', creator)
    .first();
  return row.uuid;
};

const fkName = 'text_drafts_user_uuid_foreign';
export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('text_drafts', 'user_uuid');
  if (!hasColumn) {
    await knex.schema.table('text_drafts', table => {
      table.uuid('user_uuid');
    });

    const draftRows: DraftRow[] = await knex('text_drafts').select(
      'id',
      'creator'
    );

    // Insert user UUIDs
    await Promise.all(
      draftRows.map(async ({ id, creator }) => {
        const userUuid = await getUserUuid(knex, creator);
        await knex('text_drafts').update('user_uuid', userUuid).where({ id });
      })
    );

    await knex.raw(
      'ALTER TABLE text_drafts MODIFY user_uuid CHAR(36) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL'
    );
    await knex.schema.table('text_drafts', table => {
      table
        .foreign('user_uuid', fkName)
        .references('user.uuid')
        .onDelete('CASCADE');
      table.dropForeign(['creator'], 'text_drafts_ibfk_1');
    });
    await knex.raw('ALTER TABLE text_drafts MODIFY creator INT(11) NULL');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('text_drafts', 'user_uuid');
  if (hasColumn) {
    await knex.schema.table('text_drafts', table => {
      table.dropForeign(['user_uuid'], fkName);
      table.dropColumn('user_uuid');
      table.foreign('creator', 'text_drafts_ibfk_1').references('user.id');
    });
  }
}

import * as Knex from 'knex';

const userForeignKey = 'comments_user_uuid_foreign';

export async function up(knex: Knex): Promise<void> {
  const indexRows: any[] = (
    await knex.raw('SHOW INDEX FROM comments WHERE Key_name=?', userForeignKey)
  )[0];

  await knex('comments')
    .update('user_uuid', 'ef355c22-09ab-11eb-8c9d-02b316ca7378')
    .where('user_uuid', null);

  await knex.schema.table('comments', table => {
    if (indexRows.length > 0) {
      table.dropForeign(['user_uuid'], userForeignKey);
    }
  });

  await knex.schema.alterTable('comments', table => {
    table.uuid('user_uuid').notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('comments', table => {
    table.uuid('user_uuid').nullable().alter();
    table.foreign('user_uuid', userForeignKey).references('user.uuid');
  });

  await knex('comments')
    .update('user_uuid', null)
    .where('comment', 'like', 'The status was changed from%');
}

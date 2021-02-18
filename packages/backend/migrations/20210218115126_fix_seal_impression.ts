import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('text_markup')
    .update({ type: 'isSealImpression' })
    .where({ type: 'IsSealImpression' });
}

export async function down(knex: Knex): Promise<void> {
  // Shouldn't undo this
}

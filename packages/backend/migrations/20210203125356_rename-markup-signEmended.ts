import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('text_markup')
    .update({ type: 'originalSign' })
    .where({ type: 'signEmended' });
}

export async function down(knex: Knex): Promise<void> {
  await knex('text_markup')
    .update({ type: 'signEmended' })
    .where({ type: 'originalSign' });
}

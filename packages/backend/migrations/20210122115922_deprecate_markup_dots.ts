import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('text_markup').where({ type: '...' }).update({
    type: 'missingSigns',
    '#_value': -1,
  });
}

export async function down(knex: Knex): Promise<void> {
  // No good way to go back
}

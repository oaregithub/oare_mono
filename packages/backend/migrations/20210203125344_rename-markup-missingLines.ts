import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('text_markup').update({ type: 'undeterminedLines' }).where({ type: 'missingLines' });
}

export async function down(knex: Knex): Promise<void> {
  await knex('text_markup').update({ type: 'missingLines' }).where({ type: 'undeterminedLines' });
}

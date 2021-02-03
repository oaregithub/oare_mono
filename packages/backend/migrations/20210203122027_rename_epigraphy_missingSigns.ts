import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('text_epigraphy').update({ type: 'undeterminedSigns' }).where({ type: 'missingSigns' });
}

export async function down(knex: Knex): Promise<void> {
  await knex('text_epigraphy').update({ type: 'missingSigns' }).where({ type: 'undeterminedSigns' });
}

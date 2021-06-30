import * as Knex from 'knex';

const indexName = 'sign_uuid_sequence_text_uuid_index';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('search_index', table => {
    table.index(['sign_uuid_sequence', 'text_uuid'], indexName);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('search_index', table => {
    table.dropIndex(['sign_uuid_sequence', 'text_uuid'], indexName);
  });
}

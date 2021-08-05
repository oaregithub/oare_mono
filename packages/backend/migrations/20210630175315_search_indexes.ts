import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('search_index', table => {
    table.index('sign_uuid_sequence');
    table.index(['sign_uuid_sequence', 'text_uuid']);
    table.index('text_uuid');
    table.index(['sign_uuid_sequence', 'text_name']);
    table.index('text_name', 'idx_search_index_text_name');
    table.index(
      ['text_uuid', 'text_name'],
      'idx_search_index_text_uuid_text_name'
    );
    table.index(
      ['sign_uuid_sequence', 'text_uuid', 'text_name'],
      'idx_search_index_sign_uuid_sequence_text_uuid_text_name'
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  return; // eslint-disable-line no-useless-return
}

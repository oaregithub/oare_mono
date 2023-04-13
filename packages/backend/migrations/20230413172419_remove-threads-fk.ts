import { Knex } from 'knex';

const fkName = 'threads_ibfk_1';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('threads', table => {
    table.dropForeign('reference_uuid', fkName);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('threads', table => {
    table.foreign('reference_uuid', fkName).references('uuid.uuid');
  });
}

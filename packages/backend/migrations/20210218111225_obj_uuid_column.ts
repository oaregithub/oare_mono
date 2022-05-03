import { Knex } from 'knex';

const fkName = 'text_markup_obj_uuid_foreign';
export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('text_markup', 'obj_uuid');
  if (!hasColumn) {
    await knex.schema.table('text_markup', table => {
      table.uuid('obj_uuid');
      table
        .foreign('obj_uuid', fkName)
        .references('uuid.uuid')
        .onDelete('CASCADE');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('text_markup', 'obj_uuid');
  if (hasColumn) {
    await knex.schema.table('text_markup', table => {
      table.dropForeign(['obj_uuid'], fkName);
      table.dropColumn('obj_uuid');
    });
  }
}

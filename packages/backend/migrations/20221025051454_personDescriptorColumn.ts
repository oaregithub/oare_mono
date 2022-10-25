import { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  const hasPersonDescriptorColumn = await knex.schema.hasColumn(
    'person',
    'descriptor'
  );
  if (!hasPersonDescriptorColumn) {
    await knex.schema.table('person', table => {
      table.string('descriptor');
    });
  }
}
export async function down(knex: Knex): Promise<void> {
  const hasPersonDescriptorColumn = await knex.schema.hasColumn(
    'person',
    'descriptor'
  );
  if (hasPersonDescriptorColumn) {
    await knex.schema.table('person', table => {
      table.dropColumn('descriptor');
    });
  }
}

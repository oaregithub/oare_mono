import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasSourceUuidColumn = await knex.schema.hasColumn(
    'sign',
    'source_uuid'
  );
  if (hasSourceUuidColumn) {
    await knex.schema.table('sign', table => {
      table.renameColumn('source_uuid', 'font_code');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasFontCodeColumn = await knex.schema.hasColumn('sign', 'font_code');

  if (hasFontCodeColumn) {
    await knex.schema.table('sign', table => {
      table.renameColumn('font_code', 'source_uuid');
    });
  }
}

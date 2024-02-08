import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTableRefColumn = await knex.schema.hasColumn(
    'threads',
    'table_reference'
  );
  if (!hasTableRefColumn) {
    await knex.schema.table('threads', table => {
      table.string('table_reference').notNullable().after('uuid');
    });

    const rows: { uuid: string; referenceUuid: string }[] = await knex(
      'threads'
    ).select('uuid', 'reference_uuid as referenceUuid');

    const tableReferences: string[] = await Promise.all(
      rows.map(row =>
        knex('uuid')
          .select('table_reference')
          .where('uuid', row.referenceUuid)
          .first()
          .then(r => r.table_reference)
      )
    );

    await Promise.all(
      rows.map((row, idx) =>
        knex('threads')
          .where('uuid', row.uuid)
          .update({ table_reference: tableReferences[idx] })
      )
    );

    await knex.schema.table('threads', table => {
      table.dropColumn('route');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTableRefColumn = await knex.schema.hasColumn(
    'threads',
    'table_reference'
  );
  if (hasTableRefColumn) {
    await knex.schema.table('threads', table => {
      table.dropColumn('table_reference');
      table.string('route').notNullable();
    });

    await knex('threads').update({ route: 'unknown' });
  }
}

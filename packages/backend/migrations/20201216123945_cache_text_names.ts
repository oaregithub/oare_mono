import { Knex } from 'knex';

interface AliasRow {
  uuid: string;
  name: string;
  primacy: number | null;
}

export async function up(knex: Knex): Promise<void> {
  const aliasName = async (uuid: string): Promise<string> => {
    const aliases: AliasRow[] = await knex('alias')
      .select('uuid', 'name', 'primacy')
      .where('reference_uuid', uuid)
      .orderBy('primacy');

    const primaryRow = aliases.find(
      alias => alias.primacy === null || alias.primacy === 1
    );
    const secondaryRows = aliases.filter(
      alias => alias.uuid !== primaryRow?.uuid
    );

    let secondaryNames = '';
    if (secondaryRows.length > 0) {
      secondaryNames = ` (${secondaryRows.map(alias => alias.name).join('')})`;
    }

    return `${primaryRow?.name}${secondaryNames}`;
  };

  const columnName = 'name';
  const columnRows: any[] = (
    await knex.raw(`SHOW COLUMNS FROM text LIKE '${columnName}'`)
  )[0];

  if (columnRows.length === 0) {
    // Add column
    await knex.schema.table('text', table => {
      table.string(columnName);
    });

    // Update with text names
    const textUuids: { uuid: string }[] = await knex('text').select('uuid');
    const textNames = await Promise.all(
      textUuids.map(({ uuid }) => aliasName(uuid))
    );

    await Promise.all(
      textUuids.map(({ uuid }, index) =>
        knex('text').update(columnName, textNames[index]).where({ uuid })
      )
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const columnName = 'name';
  const columnRows: any[] = (
    await knex.raw(`SHOW COLUMNS FROM text LIKE '${columnName}'`)
  )[0];

  if (columnRows.length > 0) {
    await knex.schema.table('text', table => {
      table.dropColumn('name');
    });
  }
}

import { Knex } from 'knex';

export interface AliasRow {
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

  const collections: Array<{ uuid: string }> = await knex('hierarchy')
    .select('uuid')
    .where('type', 'collection');
  const collectionUuids = collections.map(({ uuid }) => uuid);
  const collectionNames = await Promise.all(
    collectionUuids.map(uuid => aliasName(uuid))
  );

  await Promise.all(
    collectionUuids.map((uuid, index) =>
      knex('collection').insert({
        uuid,
        name: collectionNames[index],
      })
    )
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex('collection').del();
}

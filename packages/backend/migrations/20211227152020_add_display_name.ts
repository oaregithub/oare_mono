import * as Knex from 'knex';

export interface Text {
  name: string;
  excavation_prfx: string;
  excavation_no: string;
  publication_prfx: string;
  publication_no: string;
  museum_prfx: string;
  museum_no: string;
  uuid: string;
  id: Number;
}

export async function up(knex: Knex): Promise<void> {
  const hasDisplayName = await knex.schema.hasColumn('text', 'display_name');
  const Texts: Text[] = await knex
    .from('text')
    .select(
      'name',
      'excavation_prfx',
      'excavation_no',
      'publication_prfx',
      'publication_no',
      'museum_prfx',
      'museum_no',
      'uuid',
      'id'
    );

  if (!hasDisplayName) {
    await knex.schema.table('text', table => {
      table.string('display_name');
    });
  }
  async function generateDisplayName(text: Text) {
    let displayName = '';
    if (
      text.excavation_prfx &&
      text.excavation_prfx.slice(0, 2).toLowerCase() === 'kt'
    ) {
      displayName = `${text.excavation_prfx} ${text.excavation_no}`;
      if (text.publication_prfx && text.publication_no) {
        displayName += ` (${text.publication_prfx} ${text.publication_no})`;
      } else if (text.museum_prfx && text.museum_no) {
        displayName += ` (${text.museum_prfx} ${text.museum_no})`;
      }
    } else if (text.publication_prfx && text.publication_no) {
      displayName = `${text.publication_prfx} ${text.publication_no}`;
      if (text.excavation_prfx && text.excavation_no) {
        displayName += ` (${text.excavation_prfx} ${text.excavation_no})`;
      } else if (text.museum_prfx && text.museum_no) {
        displayName += ` (${text.museum_prfx} ${text.museum_no})`;
      }
    } else if (text.excavation_prfx && text.excavation_no) {
      displayName = `${text.excavation_prfx} ${text.excavation_no}`;
      if (text.museum_prfx && text.museum_no) {
        displayName += ` (${text.museum_prfx} ${text.museum_no})`;
      }
    } else if (text.museum_prfx && text.museum_no) {
      displayName = `${text.museum_prfx} ${text.museum_no}`;
    } else {
      displayName = text.name;
    }

    await knex('text')
      .where('uuid', text.uuid)
      .update('display_name', displayName);
  }
  await Promise.all(Texts.map(text => generateDisplayName(text)));
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('text');

  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('text', 'display_name');
    if (hasColumn) {
      await knex.schema.table('text', table => {
        table.dropColumn('display_name');
      });
    }
  }
}

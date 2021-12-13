import knex from '@/connection';
import { TranslitOption, Text } from '@oare/types';

interface TextUuid {
  uuid: string;
}

class TextDao {
  async getTextByUuid(uuid: string): Promise<Text | null> {
    const row: Text = await knex('text')
      .select(
        'uuid',
        'type',
        'name',
        'excavation_prfx AS excavationPrefix',
        'excavation_no AS excavationNumber',
        'museum_prfx AS museumPrefix',
        'museum_no AS museumNumber',
        'publication_prfx AS publicationPrefix',
        'publication_no AS publicationNumber'
      )
      .first()
      .where({ uuid });
    const text: Text = {
      ...row,
      name: row ? this.generateTextName(row) : '',
    };
    return text;
  }

  async getUnpublishedTextUuids(): Promise<string[]> {
    const texts: TextUuid[] = await knex('text')
      .select('text.uuid')
      .innerJoin('hierarchy', 'hierarchy.object_uuid', 'text.uuid')
      .where('hierarchy.published', false);

    return texts.map(text => text.uuid);
  }

  async getCdliNum(uuid: string): Promise<string | null> {
    const { cdliNum } = await knex('text')
      .select('cdli_num AS cdliNum')
      .where({ uuid })
      .first();
    return cdliNum;
  }

  async getTranslitStatus(uuid: string) {
    const { name: color, field: colorMeaning } = await knex('text')
      .select('alias.name', 'field.field')
      .where({ 'text.uuid': uuid })
      .innerJoin('alias', 'translit_status', 'alias.reference_uuid')
      .leftJoin('field', 'field.reference_uuid', 'alias.reference_uuid')
      .first();

    return {
      color,
      colorMeaning,
    };
  }

  async getTranslitOptions() {
    const stoplightOptions: TranslitOption[] = await knex('hierarchy')
      .select('a1.name as color', 'field.field as colorMeaning')
      .innerJoin('alias as a1', 'a1.reference_uuid', 'hierarchy.object_uuid')
      .innerJoin(
        'alias as a2',
        'a2.reference_uuid',
        'hierarchy.obj_parent_uuid'
      )
      .innerJoin('field', 'hierarchy.object_uuid', 'field.reference_uuid')
      .where('a2.name', 'transliteration status');

    return stoplightOptions.reverse();
  }

  generateTextName(row: Text): string {
    let textName: string = '';

    if (
      row.excavationPrefix &&
      row.excavationPrefix.slice(0, 2).toLowerCase() === 'kt'
    ) {
      textName = `${row.excavationPrefix} ${row.excavationNumber}`;
      if (row.publicationPrefix && row.publicationNumber) {
        textName += ` (${row.publicationPrefix} ${row.publicationNumber})`;
      } else if (row.museumPrefix && row.museumNumber) {
        textName += ` (${row.museumPrefix} ${row.museumNumber})`;
      }
    } else if (row.publicationPrefix && row.publicationNumber) {
      textName = `${row.publicationPrefix} ${row.publicationNumber}`;
      if (row.excavationPrefix && row.excavationNumber) {
        textName += ` (${row.excavationPrefix} ${row.excavationNumber})`;
      } else if (row.museumPrefix && row.museumNumber) {
        textName += ` (${row.museumPrefix} ${row.museumNumber})`;
      }
    } else if (row.excavationPrefix && row.excavationNumber) {
      textName = `${row.excavationPrefix} ${row.excavationNumber}`;
      if (row.museumPrefix && row.museumNumber) {
        textName += ` (${row.museumPrefix} ${row.museumNumber})`;
      }
    } else if (row.museumPrefix && row.museumNumber) {
      textName = `${row.museumPrefix} ${row.museumNumber}`;
    } else {
      textName = row.name;
    }

    return textName;
  }

  async updateTranslitStatus(textUuid: string, color: string) {
    const statusRow = await knex('hierarchy')
      .select('hierarchy.object_uuid as translitUuid')
      .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.object_uuid')
      .where('name', color)
      .first();
    await knex('text')
      .update('translit_status', statusRow.translitUuid)
      .where('uuid', textUuid);
  }
}

export default new TextDao();

import knex from '@/connection';
import { TranslitOption } from '@oare/types';

interface Text {
  id: number;
  uuid: string;
  type: string;
  name: string;
}

interface TextUuid {
  uuid: string;
}

class TextDao {
  async getTextByUuid(uuid: string): Promise<Text | null> {
    const row = await knex('text').first().where({ uuid });
    let textName: string = '';
    if (row.excavation_prfx?.slice(0, 2).toLowerCase() === 'kt') {
      textName = `${row.excavation_prfx} ${row.excavation_no}`;
      if (row.publication_prfx && row.publication_no) {
        textName += ` (${row.publication_prfx} ${row.publication_no})`;
      } else if (row.museum_prfx && row.museum_no) {
        textName += ` (${row.museum_prfx} ${row.museum_no})`;
      }
    } else if (row.publication_prfx && row.publication_no) {
      textName = `${row.publication_prfx} ${row.publication_no}`;
      if (row.excavation_prfx && row.excavation_no) {
        textName += ` (${row.excavation_prfx} ${row.excavation_no})`;
      } else if (row.museum_prfx && row.museum_no) {
        textName += ` (${row.museum_prfx} ${row.museum_no})`;
      }
    } else if (row.excavation_prfx && row.excavation_no) {
      textName = `${row.excavation_prfx} ${row.excavation_no}`;
      if (row.museum_prfx && row.museum_no) {
        textName += ` (${row.museum_prfx} ${row.museum_no})`;
      }
    } else if (row.museum_prfx && row.museum_no) {
      textName = `${row.museum_prfx} ${row.museum_no}`;
    } else {
      textName = row.name;
    }

    const text: Text = {
      id: row.id,
      uuid: row.uuid,
      type: row.type,
      name: textName,
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

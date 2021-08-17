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
    const text: Text = await knex('text').first().where({ uuid });
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

    return stoplightOptions;
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

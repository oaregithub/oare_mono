import knex from '@/connection';

interface Text {
  id: number;
  uuid: string;
  type: string;
}

interface TextUuid {
  uuid: string;
}

class TextDao {
  async getTextByUuid(uuid: string): Promise<Text> {
    const text: Text = await knex('text').first().where({ uuid });
    return text;
  }

  async getUnpublishedTextUuids(): Promise<string[]> {
    const texts: TextUuid[] = await knex('text')
      .select('text.uuid')
      .innerJoin('hierarchy', 'hierarchy.uuid', 'text.uuid')
      .where('hierarchy.published', false);

    return texts.map((text) => text.uuid);
  }

  async getCdliNum(uuid: string): Promise<string | null> {
    const { cdliNum } = await knex('text').select('cdli_num AS cdliNum').where({ uuid }).first();
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
}

export default new TextDao();

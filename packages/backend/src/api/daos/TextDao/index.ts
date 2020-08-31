import knex from '../../../connection';

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
}

export default new TextDao();

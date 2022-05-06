import { knexRead, knexWrite } from '@/connection';
import { TranslitOption, Text, TextRow } from '@oare/types';

interface TextUuid {
  uuid: string;
}

class TextDao {
  async getTextByUuid(uuid: string): Promise<Text | null> {
    const text: Text = await knexRead()('text')
      .select(
        'uuid',
        'type',
        'display_name as name',
        'excavation_prfx AS excavationPrefix',
        'excavation_no AS excavationNumber',
        'museum_prfx AS museumPrefix',
        'museum_no AS museumNumber',
        'publication_prfx AS publicationPrefix',
        'publication_no AS publicationNumber'
      )
      .first()
      .where({ uuid });
    return text;
  }

  async getUnpublishedTextUuids(): Promise<string[]> {
    const texts: TextUuid[] = await knexRead()('text')
      .select('text.uuid')
      .innerJoin('hierarchy', 'hierarchy.object_uuid', 'text.uuid')
      .where('hierarchy.published', false);

    return texts.map(text => text.uuid);
  }

  async getCdliNum(uuid: string): Promise<string | null> {
    const { cdliNum } = await knexRead()('text')
      .select('cdli_num AS cdliNum')
      .where({ uuid })
      .first();
    return cdliNum;
  }

  async getTranslitStatus(uuid: string) {
    const { name: color, field: colorMeaning } = await knexRead()('text')
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
    const stoplightOptions: TranslitOption[] = await knexRead()('hierarchy')
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
    const statusRow = await knexRead()('hierarchy')
      .select('hierarchy.object_uuid as translitUuid')
      .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.object_uuid')
      .where('name', color)
      .first();
    await knexWrite()('text')
      .update('translit_status', statusRow.translitUuid)
      .where('uuid', textUuid);
  }

  async updateTextInfo(
    textUuid: string,
    newExcavationPrefix: string | null,
    newExcavationNumber: string | null,
    newMuseumPrefix: string | null,
    newMuseumNumber: string | null,
    newPrimaryPublicationPrefix: string | null,
    newPrimaryPublicationNumber: string | null
  ) {
    await knexWrite()('text')
      .update({
        excavation_prfx: newExcavationPrefix,
        excavation_no: newExcavationNumber,
        museum_prfx: newMuseumPrefix,
        museum_no: newMuseumNumber,
        publication_prfx: newPrimaryPublicationPrefix,
        publication_no: newPrimaryPublicationNumber,
      })
      .where('uuid', textUuid);
  }

  async insertTextRow(row: TextRow) {
    await knexWrite()('text').insert({
      uuid: row.uuid,
      type: row.type,
      language: row.language,
      cdli_num: row.cdliNum,
      translit_status: row.translitStatus,
      name: row.name,
      display_name: row.displayName,
      excavation_prfx: row.excavationPrefix,
      excavation_no: row.excavationNumber,
      museum_prfx: row.museumPrefix,
      museum_no: row.museumNumber,
      publication_prfx: row.publicationPrefix,
      publication_no: row.publicationNumber,
      object_type: row.objectType,
      source: row.source,
      genre: row.genre,
      subgenre: row.subgenre,
    });
  }
}

export default new TextDao();

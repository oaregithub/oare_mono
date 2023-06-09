import knex from '@/connection';
import {
  Text,
  TextRow,
  LinkItem,
  TextTransliterationStatus,
} from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

class TextDao {
  /**
   * Retrieves a text by its UUID.
   * @param uuid The UUID of the text to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single text object.
   * @throws Error if the text doesn't exist or does not belong to a valid collection.
   */
  async getTextByUuid(uuid: string, trx?: Knex.Transaction): Promise<Text> {
    const CollectionDao = sl.get('CollectionDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const textRow = await this.getTextRowByUuid(uuid, trx);

    const collectionUuid = await CollectionDao.getCollectionUuidByTextUuid(
      uuid,
      trx
    );

    const hasEpigraphy = await TextEpigraphyDao.hasEpigraphy(uuid, trx);

    const text: Text = {
      ...textRow,
      collectionUuid,
      hasEpigraphy,
    };

    return text;
  }

  /**
   * Retrieves a text row by its UUID.
   * @param uuid The UUID of the text row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single text row.
   * @throws Error if no text row found.
   */
  private async getTextRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<TextRow> {
    const k = trx || knex;

    const textRow: TextRow | undefined = await k('text')
      .select(
        'uuid',
        'type',
        'language',
        'cdli_num as cdliNum',
        'translit_status as translitStatus',
        'name',
        'display_name as displayName',
        'excavation_prfx as excavationPrefix',
        'excavation_no as excavationNumber',
        'museum_prfx as museumPrefix',
        'museum_no as museumNumber',
        'publication_prfx as publicationPrefix',
        'publication_no as publicationNumber',
        'object_type as objectType',
        'source',
        'genre',
        'subgenre'
      )
      .first()
      .where({ uuid });

    if (!textRow) {
      throw new Error(`Text with uuid ${uuid} does not exist`);
    }

    return textRow;
  }

  // FIXME perhaps move to hierarchy dao?
  async getTransliterationOptions(trx?: Knex.Transaction) {
    const k = trx || knex;

    const transliterationOptions: TextTransliterationStatus[] = await k(
      'hierarchy'
    )
      .select(
        'hierarchy.object_uuid as uuid',
        'a1.name as color',
        'field.field as colorMeaning'
      )
      .innerJoin('alias as a1', 'a1.reference_uuid', 'hierarchy.object_uuid')
      .innerJoin(
        'alias as a2',
        'a2.reference_uuid',
        'hierarchy.obj_parent_uuid'
      )
      .innerJoin('field', 'hierarchy.object_uuid', 'field.reference_uuid')
      .where('a2.name', 'transliteration status');

    return transliterationOptions;
  }

  // FIXME perhaps move to hierarchy dao?
  async getTextTransliterationStatusByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<TextTransliterationStatus> {
    const k = trx || knex;

    const transliterationOption: TextTransliterationStatus = await k(
      'hierarchy'
    )
      .select(
        'hierarchy.object_uuid as uuid',
        'alias.name as color',
        'field.field as colorMeaning'
      )
      .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.object_uuid')
      .innerJoin('field', 'field.reference_uuid', 'hierarchy.object_uuid')
      .where({ 'hierarchy.object_uuid': uuid })
      .first();

    return transliterationOption;
  }

  /**
   * Updates the transliteration status of a text.
   * @param textUuid The UUID of the text to update.
   * @param transliterationUuid The UUID of the transliteration status to set.
   * @param trx Knex Transaction. Optional.
   */
  async updateTransliterationStatus(
    textUuid: string,
    transliterationUuid: string,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('text')
      .update({ translit_status: transliterationUuid })
      .where({ uuid: textUuid });
  }

  /**
   * Updates the text info of a text.
   * @param uuid The UUID of the text to update.
   * @param newExcavationPrefix The new excavation prefix.
   * @param newExcavationNumber The new excavation number.
   * @param newMuseumPrefix The new museum prefix.
   * @param newMuseumNumber The new museum number.
   * @param newPrimaryPublicationPrefix The new primary publication prefix.
   * @param newPrimaryPublicationNumber The new primary publication number.
   * @param trx Knex Transaction. Optional.
   */
  async updateTextInfo(
    uuid: string,
    newExcavationPrefix: string | null,
    newExcavationNumber: string | null,
    newMuseumPrefix: string | null,
    newMuseumNumber: string | null,
    newPrimaryPublicationPrefix: string | null,
    newPrimaryPublicationNumber: string | null,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('text')
      .update({
        excavation_prfx: newExcavationPrefix,
        excavation_no: newExcavationNumber,
        museum_prfx: newMuseumPrefix,
        museum_no: newMuseumNumber,
        publication_prfx: newPrimaryPublicationPrefix,
        publication_no: newPrimaryPublicationNumber,
      })
      .where({ uuid });
  }

  /**
   * Inserts a new text row.
   * @param row The text row to insert.
   * @param trx Knex Transaction. Optional.
   */
  async insertTextRow(row: TextRow, trx?: Knex.Transaction) {
    const k = trx || knex;

    await k('text').insert({
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

  /**
   * Removes a text by its UUID. Used when permanently deleting a text.
   * @param textUuid The UUID of the text to remove.
   * @param trx Knex Transaction. Optional.
   */
  async removeTextByUuid(textUuid: string, trx?: Knex.Transaction) {
    const k = trx || knex;

    await k('text').del().where({ uuid: textUuid });
  }

  /**
   * Searches texts. Used when searching for link property matches.
   * @param search The search string.
   * @param trx Knex Transaction. Optional.
   * @returns A list of link items.
   */
  async searchTexts(
    search: string,
    trx?: Knex.Transaction
  ): Promise<LinkItem[]> {
    const k = trx || knex;
    const rows: LinkItem[] = await k('text')
      .select('text.uuid as objectUuid', 'text.display_name as objectDisplay')
      .where(
        k.raw('LOWER(text.display_name)'),
        'like',
        `%${search.toLowerCase()}%`
      )
      .orWhere(k.raw('LOWER(text.name)'), 'like', `%${search.toLowerCase()}%`)
      .orWhere(
        k.raw(
          'CONCAT(LOWER(text.excavation_prfx), " ", LOWER(text.excavation_no))'
        ),
        'like',
        `%${search.toLowerCase()}%`
      )
      .orWhere(
        k.raw('CONCAT(LOWER(text.museum_prfx), " ", LOWER(text.museum_no))'),
        'like',
        `%${search.toLowerCase()}%`
      )
      .orWhere(
        k.raw(
          'CONCAT(LOWER(text.publication_prfx), " ", LOWER(text.publication_no))'
        ),
        'like',
        `%${search.toLowerCase()}%`
      )
      .orWhereRaw('binary text.uuid = binary ?', search)
      .orderByRaw(
        `CASE WHEN LOWER(text.display_name) LIKE '${search.toLowerCase()}' THEN 1 WHEN LOWER(text.display_name) LIKE '${search.toLowerCase()}%' THEN 2 WHEN LOWER(text.display_name) LIKE '%${search.toLowerCase()}' THEN 4 ELSE 3 END`
      )
      .orderByRaw('LOWER(text.display_name)');

    return rows;
  }
}

/**
 * TextDao instance as a singleton.
 */
export default new TextDao();

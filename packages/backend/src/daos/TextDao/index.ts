import knex from '@/connection';
import { Text, TextRow, LinkItem, Pagination } from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';
import { ignorePunctuation } from '../TextEpigraphyDao/utils';

class TextDao {
  /**
   * Retrieves a text by its UUID.
   * @param uuid The UUID of the text to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single text object.
   * @throws Error if the text doesn't exist or does not belong to a valid collection.
   */
  public async getTextByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Text> {
    const CollectionDao = sl.get('CollectionDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const textRow = await this.getTextRowByUuid(uuid, trx);

    const collectionUuid = await CollectionDao.getCollectionUuidByTextUuid(
      uuid,
      trx
    );

    const hasEpigraphy = await TextEpigraphyDao.textHasEpigraphy(uuid, trx);

    const text: Text = {
      ...textRow,
      collectionUuid,
      hasEpigraphy,
    };

    return text;
  }

  /**
   * Checks if a text exists.
   * @param uuid The UUID of the text to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the text exists.
   */
  public async textExists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const text = await k('text').first().where({ uuid });

    return !!text;
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

  /**
   * Updates the transliteration status of a text.
   * @param textUuid The UUID of the text to update.
   * @param transliterationUuid The UUID of the transliteration status to set.
   * @param trx Knex Transaction. Optional.
   */
  public async updateTransliterationStatus(
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
  public async updateTextInfo(
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
  public async insertTextRow(row: TextRow, trx?: Knex.Transaction) {
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
   * Searches texts. Used when searching for link property matches.
   * @param search The search string.
   * @param trx Knex Transaction. Optional.
   * @returns A list of link items.
   */
  public async searchTextsLinkProperties(
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

  /**
   * Searches texts by name.
   * @param pagination Pagination object.
   * @param textsToHide Array of text uuids that the requesting user is not allowed to view.
   * @param trx Knex Transaction. Optional.
   * @returns Paginated array of text uuids that match the search.
   */
  public async searchTexts(
    pagination: Pagination,
    textsToHide: string[],
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const cleanSearch = ignorePunctuation(pagination.filter || '');

    const uuids: string[] = await k('text')
      .pluck('uuid')
      .whereNotIn('uuid', textsToHide)
      .orderBy('display_name')
      .andWhere(function () {
        this.whereRaw('LOWER(text.display_name) REGEXP ?', [cleanSearch])
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.excavation_prfx, ''), ' ', IFNULL(text.excavation_no, ''))) REGEXP ?",
            [cleanSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.publication_prfx, ''), ' ', IFNULL(text.publication_no, ''))) REGEXP ?",
            [cleanSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.museum_prfx, ''), ' ', IFNULL(text.museum_no, ''))) REGEXP ?",
            [cleanSearch]
          );
      })
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit);

    return uuids;
  }
}

/**
 * TextDao instance as a singleton.
 */
export default new TextDao();

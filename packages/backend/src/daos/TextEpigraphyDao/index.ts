import _ from 'lodash';
import {
  EpigraphicUnit,
  Pagination,
  SearchCooccurrence,
  SearchTransliterationMode,
  TextEpigraphyRow,
} from '@oare/types';
import knex from '@/connection';
import { Knex } from 'knex';
import sl from '@/serviceLocator';
import { convertSideNumberToSide } from '@oare/oare';

class TextEpigraphyDao {
  /**
   * Retrieves a list of epigraphy UUIDs associated with a given text UUID.
   * @param textUuid The text UUID to retrieve epigraphy UUIDs for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of epigraphy UUIDs.
   */
  private async getEpigraphyUuidsByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('text_epigraphy')
      .pluck('uuid')
      .where({ text_uuid: textUuid })
      .orderBy('object_on_tablet');

    return uuids;
  }

  /**
   * Constructs an epigraphy unit for a given epigraphy UUID.
   * @param uuid The UUID of the epigraphy unit to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns An epigraphy unit.
   */
  private async getEpigraphyUnitByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<EpigraphicUnit> {
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const SignDao = sl.get('SignDao');
    const SignReadingDao = sl.get('SignReadingDao');
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const DictionarySpellingDao = sl.get('DictionarySpellingDao');
    const DictionaryFormDao = sl.get('DictionaryFormDao');
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const TextMarkupDao = sl.get('TextMarkupDao');

    const epigraphyRow = await this.getTextEpigraphyRowByUuid(uuid, trx);

    const properties = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
      uuid,
      trx
    );

    const signRow = epigraphyRow.signUuid
      ? await SignDao.getSignRowByUuid(epigraphyRow.signUuid, trx)
      : null;

    const signReadingRow = epigraphyRow.readingUuid
      ? await SignReadingDao.getSignReadingRowByUuid(
          epigraphyRow.readingUuid,
          trx
        )
      : null;

    const textMarkupUuids = await TextMarkupDao.getTextMarkupUuidsByReferenceUuid(
      uuid,
      trx
    );
    const markup = await Promise.all(
      textMarkupUuids.map(textMarkupUuid =>
        TextMarkupDao.getTextMarkupRowByUuid(textMarkupUuid, trx)
      )
    );

    const discourseExists = epigraphyRow.discourseUuid
      ? await TextDiscourseDao.textDiscourseExists(
          epigraphyRow.discourseUuid,
          trx
        )
      : false;

    const discourse =
      discourseExists && epigraphyRow.discourseUuid
        ? await TextDiscourseDao.getTextDiscourseRowByUuid(
            epigraphyRow.discourseUuid,
            trx
          )
        : null;

    const spelling =
      discourse && discourse.spellingUuid
        ? await DictionarySpellingDao.getDictionarySpellingRowByUuid(
            discourse.spellingUuid,
            trx
          )
        : null;

    const form = spelling
      ? await DictionaryFormDao.getDictionaryFormRowByUuid(
          spelling.referenceUuid,
          trx
        )
      : null;

    const word = form
      ? await DictionaryWordDao.getDictionaryWordRowByUuid(
          form.referenceUuid,
          trx
        )
      : null;

    const sideReading = epigraphyRow.side
      ? convertSideNumberToSide(epigraphyRow.side)
      : null;

    const epigraphicUnit: EpigraphicUnit = {
      ...epigraphyRow,
      sideReading,
      properties,
      signRow,
      signReadingRow,
      markup,
      discourse,
      spelling,
      form,
      word,
    };

    return epigraphicUnit;
  }

  /**
   * Retrieves an array of epigraphy units for a given text.
   * @param textUuid The text UUID to retrieve epigraphy units for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of epigraphy units.
   */
  public async getEpigraphicUnits(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<EpigraphicUnit[]> {
    const epigraphyUuids = await this.getEpigraphyUuidsByTextUuid(
      textUuid,
      trx
    );

    const units = await Promise.all(
      epigraphyUuids.map(uuid => this.getEpigraphyUnitByUuid(uuid, trx))
    );

    return units;
  }

  /**
   * Retrieves a single text epigraphy row by UUID.
   * @param uuid The UUID of the text epigraphy row.
   * @param trx Knex Transaction. Optional.
   * @returns A single text epigraphy row.
   * @throws Error if no text epigraphy row with the given UUID exists.
   */
  private async getTextEpigraphyRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<TextEpigraphyRow> {
    const k = trx || knex;

    const row: TextEpigraphyRow | undefined = await k('text_epigraphy')
      .select(
        'uuid',
        'type',
        'text_uuid as textUuid',
        'tree_uuid as treeUuid',
        'parent_uuid as parentUuid',
        'object_on_tablet as objectOnTablet',
        'side',
        'column',
        'line',
        'char_on_line as charOnLine',
        'char_on_tablet as charOnTablet',
        'sign_uuid as signUuid',
        'sign',
        'reading_uuid as readingUuid',
        'reading',
        'discourse_uuid as discourseUuid'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`No text epigraphy row with uuid ${uuid}`);
    }

    return row;
  }

  /**
   * Retrieves a list of epigraphy UUIDs for a given discourse UUID.
   * @param discourseUuid The discourse UUID of the text epigraphy rows.
   * @param trx Knex Transaction. Optional.
   * @returns An array of epigraphy UUIDs.
   */
  private async getTextEpigraphyUuidsByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const row: string[] = await k('text_epigraphy')
      .pluck('uuid')
      .where({ discourse_uuid: discourseUuid });

    return row;
  }

  /**
   * Retrieves an array of text epigraphy row by its discourse UUID.
   * @param discourseUuid The discourse UUID of the text epigraphy row.s
   * @param trx Knex Transaction. Optional.
   * @returns An array of text epigraphy row.
   * @throws Error if no text epigraphy row with the given discourse UUID exists.
   */
  public async getTextEpigraphyRowsByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<TextEpigraphyRow[]> {
    const epigraphyUuids = await this.getTextEpigraphyUuidsByDiscourseUuid(
      discourseUuid,
      trx
    );

    const rows = await Promise.all(
      epigraphyUuids.map(uuid => this.getTextEpigraphyRowByUuid(uuid, trx))
    );

    return rows;
  }

  /**
   * Checks if a text has an existing epigraphy. Used to determined if a text can be clicked on.
   * @param textUuid The UUID of the text.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating if the text has an epigraphy.
   */
  public async textHasEpigraphy(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const response = await k('text_epigraphy')
      .first()
      .where({ text_uuid: textUuid });

    return !!response;
  }

  /**
   * Inserts a new text epigraphy row.
   * @param row The text epigraphy row to insert.
   * @param trx Knex Transaction. Optional.
   */
  public async insertEpigraphyRow(
    row: TextEpigraphyRow,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('text_epigraphy').insert({
      uuid: row.uuid,
      type: row.type,
      text_uuid: row.textUuid,
      tree_uuid: row.treeUuid,
      parent_uuid: row.parentUuid,
      object_on_tablet: row.objectOnTablet,
      side: row.side,
      column: row.column,
      line: row.line,
      char_on_line: row.charOnLine,
      char_on_tablet: row.charOnTablet,
      sign_uuid: row.signUuid,
      sign: row.sign,
      reading_uuid: row.readingUuid,
      reading: row.reading,
      discourse_uuid: row.discourseUuid,
    });
  }

  /**
   * Retrieves the line number of a text epigraphy row by its discourse UUID.
   * @param discourseUuid The discourse UUID of the text epigraphy row.
   * @param trx Knex Transaction. Optional.
   * @returns The line number of the text epigraphy row.
   */
  public async getLineByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<number | null> {
    const k = trx || knex;

    const row: { line: number | null } | undefined = await k('text_epigraphy')
      .select('line')
      .where({ discourse_uuid: discourseUuid })
      .first();

    if (!row) {
      throw new Error(
        `No text epigraphy row with discourse uuid ${discourseUuid}`
      );
    }

    return row.line;
  }

  /**
   * Increments the object on tablet of a text epigraphy row by the given amount.
   * @param textUuid The UUID of the text whose epigraphy rows to increment.
   * @param objectOnTablet All rows with a object on tablet greater than or equal to this, belonging to the provided text, will be incremented.
   * @param amount The amount to increment by.
   * @param trx Knex Transaction. Optional.
   */
  public async incrementObjectOnTablet(
    textUuid: string,
    objectOnTablet: number,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('text_epigraphy')
      .where({
        text_uuid: textUuid,
      })
      .andWhere('object_on_tablet', '>=', objectOnTablet)
      .increment('object_on_tablet', amount);
  }

  /**
   * Gets the number of occurrences of a sign in the text_epigraphy table.
   * @param uuid The UUID of the sign to get the occurrences for.
   * @param trx Knex Transaction. Optional.
   * @returns A number indicating the number of occurrences of the sign.
   */
  public async getSignOccurrencesCount(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;

    const count = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .where({ sign_uuid: uuid })
      .first();

    return count && count.count ? Number(count.count) : 0;
  }

  /**
   * Gets the number of occurrences of a sign reading in the text_epigraphy table.
   * @param uuid The UUID of the sign reading to get the occurrences for.
   * @param trx Knex Transaction. Optional.
   * @returns A number indicating the number of occurrences of the sign reading.
   */
  public async getSignReadingOccurrencesCount(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;

    const count = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .where({ reading_uuid: uuid })
      .first();

    return count && count.count ? Number(count.count) : 0;
  }

  /**
   * Performs a transliteration search and returns texts that match the search.
   * @param transliterationUuids Array of search cooccurrences.
   * @param pagination Pagination object. Only limit and page are used.
   * @param userUuid The UUID of the user performing the search. Used to filter out results in texts that the user does not have permission to view.
   * @param mode The search transliteration mode.
   * @param trx Knex Transaction. Optional.
   * @returns Array of text UUIDs.
   */
  public async searchTransliteration(
    transliterationUuids: SearchCooccurrence[],
    pagination: Pagination,
    userUuid: string | null,
    mode: SearchTransliterationMode,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const utils = sl.get('utils');

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);
    const notUuids = await utils.getNotOccurrenceTexts(
      transliterationUuids,
      mode,
      trx
    );

    const matchingTexts: string[] = await utils
      .getSearchQuery(transliterationUuids, textsToHide, true, mode, trx)
      .distinct('text.uuid as uuid')
      .whereNotIn('text.uuid', notUuids)
      .orderBy('text.display_name')
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit)
      .then(rows => rows.map(r => r.uuid));

    return matchingTexts;
  }

  /**
   * Performs a transliteration search and returns the lines that match the search in a given text.
   * @param textUuid The UUID of the text to search in.
   * @param transliterationUuids The search cooccurrences.
   * @param mode The search transliteration mode.
   * @param trx Knex Transaction. Optional.
   * @returns Array of line numbers that match the search.
   */
  public async searchTransliterationLines(
    textUuid: string,
    transliterationUuids: SearchCooccurrence[],
    mode: SearchTransliterationMode,
    trx?: Knex.Transaction
  ): Promise<number[]> {
    const utils = sl.get('utils');

    const andCooccurrences = transliterationUuids.filter(
      char => char.type === 'AND'
    );

    const lines: number[] = (
      await Promise.all(
        andCooccurrences.map(async (_char, index) => {
          const query = utils.getSequentialCharacterQuery(
            andCooccurrences,
            true,
            mode,
            undefined,
            trx
          );

          const rows = await query
            .distinct(index === 0 ? 'text_epigraphy.line' : `t${index}00.line`)
            .groupBy(index === 0 ? 'text_epigraphy.line' : `t${index}00.line`)
            .where('text_epigraphy.text_uuid', textUuid);

          return rows.map(r => r.line);
        })
      )
    ).flat();

    return [...new Set(lines.sort((a, b) => a - b))];
  }

  /**
   * Performs a transliteration search and returns the discourse UUIDs that match the search in a given text.
   * Used to highlight the matching results in the text.
   * @param textUuid The UUID of the text to search in.
   * @param transliterationUuids The search cooccurrences.
   * @param mode The search transliteration mode.
   * @param trx Knex Transaction. Optional.
   * @returns Array of discourse UUIDs that match the search.
   */
  public async searchTransliterationDiscourseUuids(
    textUuid: string,
    transliterationUuids: SearchCooccurrence[],
    mode: SearchTransliterationMode,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const utils = sl.get('utils');

    const andOccurrences = transliterationUuids.filter(
      char => char.type === 'AND'
    );

    const discourseUuids: string[] = (
      await Promise.all(
        andOccurrences.map(async _char => {
          const columnNamesToSelect: string[] = [];
          andOccurrences.forEach((occurrence, coocIdx) => {
            occurrence.words.forEach((word, wordIdx) => {
              word.uuids.forEach((_uuid, charIdx) => {
                if (coocIdx === 0 && wordIdx === 0 && charIdx === 0) {
                  columnNamesToSelect.push(
                    `text_epigraphy.discourse_uuid as t${coocIdx}${wordIdx}${charIdx}`
                  );
                } else {
                  columnNamesToSelect.push(
                    `t${coocIdx}${wordIdx}${charIdx}.discourse_uuid as t${coocIdx}${wordIdx}${charIdx}`
                  );
                }
              });
            });
          });

          const query = utils.getSequentialCharacterQuery(
            andOccurrences,
            true,
            mode,
            undefined,
            trx
          );

          const rows: string[] = await query
            .select(columnNamesToSelect)
            .where('text_epigraphy.text_uuid', textUuid);

          return rows.flatMap(r => Object.values(r));
        })
      )
    ).flat();

    return [...new Set(discourseUuids)];
  }

  /**
   * Performs a transliteration search and returns the number texts that have a match.
   * @param transliterationUuids The search cooccurrences.
   * @param userUuid The UUID of the user performing the search. Used to filter out results in texts that the user does not have permission to view.
   * @param mode The search transliteration mode.
   * @param trx Knex Transaction. Optional.
   * @returns Number of text matches.
   */
  public async searchTransliterationCount(
    transliterationUuids: SearchCooccurrence[],
    userUuid: string | null,
    mode: SearchTransliterationMode,
    trx?: Knex.Transaction
  ): Promise<number> {
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const utils = sl.get('utils');

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);
    const notUuids = await utils.getNotOccurrenceTexts(
      transliterationUuids,
      mode,
      trx
    );

    const count = await utils
      .getSearchQuery(transliterationUuids, textsToHide, true, mode, trx)
      .countDistinct({ count: 'text.uuid' })
      .whereNotIn('text.uuid', notUuids)
      .first();

    return count && count.count ? Number(count.count) : 0;
  }
}

/**
 * TextEpigraphyDao instance as a singleton.
 */
export default new TextEpigraphyDao();

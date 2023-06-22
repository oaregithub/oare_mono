import _ from 'lodash';
import {
  EpigraphicUnit,
  Pagination,
  SearchCooccurrence,
  SearchNullDiscourseLine,
  TextEpigraphyRow,
} from '@oare/types';
import knex from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import {
  getSearchQuery,
  convertEpigraphicUnitRows,
  getSequentialCharacterQuery,
  getNotOccurrenceTexts,
} from './utils';
import TextMarkupDao from '../TextMarkupDao';

// FIXME

export interface EpigraphicQueryRow
  extends Omit<EpigraphicUnit, 'side' | 'markups'> {
  side: number;
  epigReading: string;
}

export interface GetEpigraphicUnitsOptions {
  minLine?: number;
  maxLine?: number;
}

export interface TextUuidWithLines {
  uuid: string;
  lines: number[];
  discourseUuids: string[];
}

export interface SearchTextArgs {
  characters: SearchCooccurrence[];
  title: string;
  userUuid: string | null;
  pagination: Pagination;
  mode: 'respectNoBoundaries' | 'respectBoundaries' | 'respectAllBoundaries';
}

class TextEpigraphyDao {
  async getEpigraphicUnits(
    textUuid: string,
    { maxLine, minLine }: GetEpigraphicUnitsOptions = {},
    trx?: Knex.Transaction
  ): Promise<EpigraphicUnit[]> {
    const k = trx || knex;
    let query = k('text_epigraphy')
      .leftJoin(
        'sign_reading',
        'text_epigraphy.reading_uuid',
        'sign_reading.uuid'
      )
      .leftJoin(
        'text_discourse',
        'text_epigraphy.discourse_uuid',
        'text_discourse.uuid'
      )
      .where('text_epigraphy.text_uuid', textUuid)
      .select(
        'text_epigraphy.uuid',
        'text_epigraphy.side',
        'text_epigraphy.column',
        'text_epigraphy.line',
        'text_epigraphy.reading AS epigReading',
        'text_epigraphy.char_on_line AS charOnLine',
        'text_epigraphy.char_on_tablet AS charOnTablet',
        'text_epigraphy.discourse_uuid AS discourseUuid',
        'text_epigraphy.object_on_tablet AS objOnTablet',
        'text_epigraphy.type AS epigType',
        'text_epigraphy.sign_uuid AS signUuid',
        'text_epigraphy.reading_uuid AS readingUuid',
        'sign_reading.reading',
        'sign_reading.type',
        'sign_reading.value',
        'text_discourse.spelling_uuid as spellingUuid'
      )
      .orderBy('text_epigraphy.object_on_tablet');

    if (minLine) {
      query = query.andWhere('text_epigraphy.line', '>=', minLine);
    }

    if (maxLine) {
      query = query.andWhere('text_epigraphy.line', '<=', maxLine);
    }

    const units: EpigraphicQueryRow[] = await query;
    const markupUnits = await TextMarkupDao.getMarkups(
      textUuid,
      undefined,
      undefined,
      trx
    );

    const epigraphicUnits = convertEpigraphicUnitRows(units, markupUnits);

    return epigraphicUnits;
  }

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

  private async getTextEpigraphyUuidByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const row: { uuid: string } | undefined = await k('text_epigraphy')
      .select('uuid')
      .where({ discourse_uuid: discourseUuid })
      .first();

    if (!row) {
      throw new Error(
        `No text epigraphy row with discourse uuid ${discourseUuid}`
      );
    }

    return row.uuid;
  }

  public async getTextEpigraphyRowByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<TextEpigraphyRow> {
    const epigraphyUuid = await this.getTextEpigraphyUuidByDiscourseUuid(
      discourseUuid,
      trx
    );

    const row = await this.getTextEpigraphyRowByUuid(epigraphyUuid, trx);

    return row;
  }

  private async getMatchingTexts(
    { characters, title, pagination, userUuid, mode }: SearchTextArgs,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);
    const notUuids = await getNotOccurrenceTexts(characters, mode, trx);

    const matchingTexts: Array<{ uuid: string }> = await getSearchQuery(
      characters,
      textsToHide,
      true,
      mode,
      title,
      trx
    )
      .select('text_epigraphy.text_uuid as uuid')
      .whereNotIn('text_epigraphy.text_uuid', notUuids)
      .orderBy('text.display_name')
      .groupBy('text.uuid')
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit);

    return matchingTexts.map(({ uuid }) => uuid);
  }

  private async getMatchingLines(
    textUuid: string,
    rawCharacters: SearchCooccurrence[],
    mode: 'respectNoBoundaries' | 'respectBoundaries' | 'respectAllBoundaries',
    trx?: Knex.Transaction
  ): Promise<number[]> {
    const characters = rawCharacters.filter(char => char.type === 'AND');
    const rows: Array<{ line: number }> = (
      await Promise.all(
        characters.map((_char, index) => {
          const query = getSequentialCharacterQuery(
            characters,
            true,
            mode,
            undefined,
            trx
          );
          return query
            .distinct(index === 0 ? 'text_epigraphy.line' : `t${index}00.line`)
            .groupBy(index === 0 ? 'text_epigraphy.line' : `t${index}00.line`)
            .where('text_epigraphy.text_uuid', textUuid);
        })
      )
    ).flat();

    const lines = rows.map(({ line }) => line).sort((a, b) => a - b);
    return [...new Set(lines)];
  }

  private async getDiscourseUuids(
    textUuid: string,
    rawCharacters: SearchCooccurrence[],
    mode: 'respectNoBoundaries' | 'respectBoundaries' | 'respectAllBoundaries',
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const characters = rawCharacters.filter(char => char.type === 'AND');
    const rows: Array<{ discourseUuid: string }> = (
      await Promise.all(
        characters.map(_char => {
          const query = getSequentialCharacterQuery(
            characters,
            true,
            mode,
            undefined,
            trx
          );
          return query
            .distinct('text_epigraphy.discourse_uuid AS discourseUuid')
            .where('text_epigraphy.text_uuid', textUuid);
        })
      )
    ).flat();

    const uuids = rows.map(row => row.discourseUuid);
    return [...new Set(uuids)];
  }

  async searchTexts(
    args: SearchTextArgs,
    trx?: Knex.Transaction
  ): Promise<TextUuidWithLines[]> {
    const textUuids = await this.getMatchingTexts(args, trx);

    const textLines = await Promise.all(
      textUuids.map(uuid =>
        this.getMatchingLines(uuid, args.characters, args.mode, trx)
      )
    );

    const discourseUuids = await Promise.all(
      textUuids.map(uuid =>
        this.getDiscourseUuids(uuid, args.characters, args.mode, trx)
      )
    );

    return textUuids.map((uuid, index) => ({
      uuid,
      lines: textLines[index],
      discourseUuids: discourseUuids[index],
    }));
  }

  async searchTextsTotal(
    {
      characters,
      title,
      userUuid,
      mode,
    }: Pick<SearchTextArgs, 'characters' | 'title' | 'userUuid' | 'mode'>,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);
    const notUuids = await getNotOccurrenceTexts(characters, mode, trx);

    const totalRows: number = (
      await getSearchQuery(characters, textsToHide, true, mode, title, trx)
        .select(k.raw('COUNT(DISTINCT text.uuid) AS count'))
        .whereNotIn('text_epigraphy.text_uuid', notUuids)
        .first()
    ).count;

    return totalRows;
  }

  async searchNullDiscourseCount(
    characterUuids: SearchCooccurrence[],
    userUuid: string | null,
    includeSuperfluous: boolean,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);

    const count = await getSearchQuery(
      characterUuids,
      textsToHide,
      includeSuperfluous,
      'respectNoBoundaries',
      undefined,
      trx
    )
      .select(k.raw('COUNT(DISTINCT text_epigraphy.uuid) AS count'))
      .modify(qb => {
        characterUuids[0].words[0].uuids.forEach((_uuid, idx) => {
          if (idx === 0) {
            qb.whereNull('text_epigraphy.discourse_uuid');
          } else {
            qb.whereNull(`t00${idx}.discourse_uuid`);
          }
        });
      })
      .first();

    return count.count;
  }

  async searchNullDiscourse(
    characterUuids: SearchCooccurrence[],
    page: number,
    limit: number,
    userUuid: string | null,
    includeSuperfluous: boolean,
    trx?: Knex.Transaction
  ): Promise<SearchNullDiscourseLine[]> {
    const k = trx || knex;
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);

    const epigraphyUuidColumns: string[] = ['text_epigraphy.uuid'];
    characterUuids[0].words[0].uuids.forEach((_char, idx) => {
      if (idx > 0) {
        epigraphyUuidColumns.push(`t00${idx}.uuid AS uuid${idx}`);
      }
    });

    const occurrences: any[] = await getSearchQuery(
      characterUuids,
      textsToHide,
      includeSuperfluous,
      'respectNoBoundaries',
      undefined,
      trx
    )
      .distinct(epigraphyUuidColumns)
      .modify(qb => {
        characterUuids[0].words[0].uuids.forEach((_uuid, idx) => {
          if (idx === 0) {
            qb.whereNull('text_epigraphy.discourse_uuid');
          } else {
            qb.whereNull(`t00${idx}.discourse_uuid`);
          }
        });
      })
      .orderBy('text.name')
      .orderBy('text_epigraphy.line')
      .offset((page - 1) * limit)
      .limit(limit);

    const epigraphyOccurrencesUuids: string[][] = occurrences.map(row =>
      Object.values(row)
    );
    const lineInfo = await Promise.all(
      epigraphyOccurrencesUuids.map(uuids =>
        k('text_epigraphy')
          .select('text_uuid AS textUuid', 'line')
          .whereIn('uuid', uuids)
          .first()
      )
    );

    return epigraphyOccurrencesUuids.map((epigraphyUuids, idx) => ({
      textUuid: lineInfo[idx].textUuid,
      epigraphyUuids,
      line: lineInfo[idx].line,
    }));
  }

  async hasEpigraphy(uuid: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;
    const response = await k('text_epigraphy')
      .first('uuid')
      .where('text_uuid', uuid);
    return !!response;
  }

  async addDiscourseUuid(
    epigraphyUuids: string[],
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('text_epigraphy')
      .update('discourse_uuid', discourseUuid)
      .whereIn('uuid', epigraphyUuids);
  }

  async insertEpigraphyRow(row: TextEpigraphyRow, trx?: Knex.Transaction) {
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

  async getNumEpigraphyRowsByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;
    const countResult = await k('text_epigraphy')
      .where({ text_uuid: textUuid })
      .count({ count: 'text_epigraphy.uuid' })
      .first();
    return countResult && countResult.count ? (countResult.count as number) : 0;
  }

  async getLineByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<number | null> {
    const k = trx || knex;

    const line: number | null = await k('text_epigraphy')
      .select('line')
      .where({ discourse_uuid: discourseUuid })
      .first()
      .then(row => row.line);

    return line;
  }

  async incrementObjectOnTablet(
    textUuid: string,
    objectOnTablet: number | null,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    if (objectOnTablet) {
      await k('text_epigraphy')
        .where({
          text_uuid: textUuid,
        })
        .andWhere('object_on_tablet', '>=', objectOnTablet)
        .increment('object_on_tablet', amount);
    }
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

    const count: number = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .where({ sign_uuid: uuid })
      .first()
      .then(row => (row && row.count ? Number(row.count) : 0));

    return count;
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

    const count: number = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .where({ reading_uuid: uuid })
      .first()
      .then(row => (row && row.count ? Number(row.count) : 0));

    return count;
  }
}

/**
 * TextEpigraphyDao instance as a singleton.
 */
export default new TextEpigraphyDao();

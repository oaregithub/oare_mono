import _ from 'lodash';
import {
  EpigraphicUnit,
  Pagination,
  SearchCooccurrence,
  SearchNullDiscourseLine,
  TextEpigraphyRow,
} from '@oare/types';
import { knexRead, knexWrite } from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import {
  getSearchQuery,
  convertEpigraphicUnitRows,
  getSequentialCharacterQuery,
  getNotOccurrenceTexts,
} from './utils';
import TextMarkupDao from '../TextMarkupDao';

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

export interface AnchorInfo {
  wordOnTablet: number | null;
  objInText: number | null;
  childNum: number | null;
  treeUuid: string;
}

class TextEpigraphyDao {
  async getEpigraphicUnits(
    textUuid: string,
    { maxLine, minLine }: GetEpigraphicUnitsOptions = {},
    trx?: Knex.Transaction
  ): Promise<EpigraphicUnit[]> {
    const k = trx || knexRead();
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
      .andWhere(function () {
        this.whereNot('text_epigraphy.char_on_tablet', null);
        this.orWhere('text_epigraphy.type', 'region');
        this.orWhere('text_epigraphy.type', 'section');
        this.orWhere('text_epigraphy.type', 'undeterminedLines');
      })
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
      trx
    );

    const epigraphicUnitRowsWithSections = convertEpigraphicUnitRows(
      units,
      markupUnits
    );
    const epigraphicUnits = epigraphicUnitRowsWithSections.filter(
      unit => unit.epigType !== 'section'
    );
    return epigraphicUnits;
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
    const k = trx || knexRead();
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
    const k = trx || knexRead();
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
    const k = trx || knexRead();
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
    const k = trx || knexRead();
    const response = await k('text_epigraphy')
      .first('uuid')
      .where('text_uuid', uuid);
    return !!response;
  }

  async getAnchorInfo(
    epigraphyUuids: string[],
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<AnchorInfo> {
    const k = trx || knexRead();
    const newWordCharOnTablet: number = (
      await k('text_epigraphy')
        .whereIn('uuid', epigraphyUuids)
        .pluck('char_on_tablet')
        .orderBy('char_on_tablet', 'asc')
    )[0];
    let isFirstWord = false;
    let anchorDiscourseRow: { discourseUuid: string } = await k(
      'text_epigraphy'
    )
      .where('text_uuid', textUuid)
      .whereNotNull('discourse_uuid')
      .andWhere(function () {
        this.where('char_on_tablet', '<', newWordCharOnTablet);
      })
      .select('discourse_uuid AS discourseUuid')
      .orderBy('char_on_tablet', 'desc')
      .first();
    if (!anchorDiscourseRow) {
      isFirstWord = true;
      anchorDiscourseRow = await k('text_epigraphy')
        .where('text_uuid', textUuid)
        .whereNotNull('discourse_uuid')
        .andWhere(function () {
          this.where('char_on_tablet', '>', newWordCharOnTablet);
        })
        .select('discourse_uuid AS discourseUuid')
        .orderBy('char_on_tablet', 'asc')
        .first();
    }
    const anchorDiscourseUuid = anchorDiscourseRow.discourseUuid;
    const anchorInfo: AnchorInfo = await k('text_discourse')
      .where('uuid', anchorDiscourseUuid)
      .select(
        'word_on_tablet AS wordOnTablet',
        'obj_in_text AS objInText',
        'child_num AS childNum',
        'tree_uuid AS treeUuid'
      )
      .first();

    if (!isFirstWord && anchorInfo.childNum) {
      anchorInfo.childNum += 1;
    }
    if (!isFirstWord && anchorInfo.objInText) {
      anchorInfo.objInText += 1;
    }
    if (!isFirstWord && anchorInfo.wordOnTablet) {
      anchorInfo.wordOnTablet += 1;
    }
    return anchorInfo;
  }

  async addDiscourseUuid(
    epigraphyUuids: string[],
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('text_epigraphy')
      .update('discourse_uuid', discourseUuid)
      .whereIn('uuid', epigraphyUuids);
  }

  async insertEpigraphyRow(row: TextEpigraphyRow, trx?: Knex.Transaction) {
    const k = trx || knexWrite();
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
    const k = trx || knexRead();
    const countResult = await k('text_epigraphy')
      .where({ text_uuid: textUuid })
      .count({ count: 'text_epigraphy.uuid' })
      .first();
    return countResult && countResult.count ? (countResult.count as number) : 0;
  }

  async removeEpigraphyRowsByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    let numEpigraphyRows = await this.getNumEpigraphyRowsByTextUuid(
      textUuid,
      trx
    );
    while (numEpigraphyRows > 0) {
      const parentUuids = (
        await k('text_epigraphy') // eslint-disable-line no-await-in-loop
          .distinct('parent_uuid')
          .where({ text_uuid: textUuid })
          .whereNotNull('parent_uuid')
      ).map(row => row.parent_uuid);
      const rowsToDelete: string[] = await k('text_epigraphy') // eslint-disable-line no-await-in-loop
        .pluck('uuid')
        .where({ text_uuid: textUuid })
        .whereNotIn('uuid', parentUuids);

      await k('text_epigraphy').del().whereIn('uuid', rowsToDelete); // eslint-disable-line no-await-in-loop

      numEpigraphyRows -= rowsToDelete.length;
    }
  }
}

export default new TextEpigraphyDao();

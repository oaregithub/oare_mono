import _ from 'lodash';
import {
  EpigraphicUnit,
  Pagination,
  SearchCooccurrence,
  SearchNullDiscourseLine,
} from '@oare/types';
import knex from '@/connection';
import {
  getSearchQuery,
  convertEpigraphicUnitRows,
  getSequentialCharacterQuery,
  getNotOccurrenceTexts,
} from './utils';
import TextGroupDao from '../TextGroupDao';
import CollectionGroupDao from '../CollectionGroupDao';
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
}

export interface SearchTextArgs {
  characters: SearchCooccurrence[];
  title: string;
  userUuid: string | null;
  pagination: Pagination;
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
    { maxLine, minLine }: GetEpigraphicUnitsOptions = {}
  ): Promise<EpigraphicUnit[]> {
    let query = knex('text_epigraphy')
      .leftJoin(
        'sign_reading',
        'text_epigraphy.reading_uuid',
        'sign_reading.uuid'
      )
      .where('text_uuid', textUuid)
      .andWhere(function () {
        this.whereNot('text_epigraphy.char_on_tablet', null);
        this.orWhere('text_epigraphy.type', 'region');
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
        'sign_reading.value'
      )
      .orderBy('text_epigraphy.object_on_tablet');

    if (minLine) {
      query = query.andWhere('text_epigraphy.line', '>=', minLine);
    }

    if (maxLine) {
      query = query.andWhere('text_epigraphy.line', '<=', maxLine);
    }

    const units: EpigraphicQueryRow[] = await query;
    const markupUnits = await TextMarkupDao.getMarkups(textUuid);

    return convertEpigraphicUnitRows(units, markupUnits);
  }

  private async getMatchingTexts({
    characters,
    title,
    pagination,
    userUuid,
  }: SearchTextArgs): Promise<string[]> {
    const {
      blacklist: textBlacklist,
      whitelist: textWhitelist,
    } = await TextGroupDao.getUserBlacklist(userUuid);
    const {
      blacklist: collectionBlacklist,
    } = await CollectionGroupDao.getUserCollectionBlacklist(userUuid);
    const notUuids = await getNotOccurrenceTexts(characters);

    const matchingTexts: Array<{ uuid: string }> = await getSearchQuery(
      characters,
      textBlacklist,
      textWhitelist,
      collectionBlacklist,
      title
    )
      .select('text_epigraphy.text_uuid AS uuid')
      .whereNotIn('text_epigraphy.text_uuid', notUuids)
      .orderBy('text.name')
      .groupBy('text.name')
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit);

    return matchingTexts.map(({ uuid }) => uuid);
  }

  private async getMatchingLines(
    textUuid: string,
    rawCharacters: SearchCooccurrence[]
  ): Promise<number[]> {
    const characters = rawCharacters.filter(char => char.type === 'AND');
    const rows: Array<{ line: number }> = (
      await Promise.all(
        characters.map((_char, index) => {
          const query = getSequentialCharacterQuery(characters);
          return query
            .distinct(index === 0 ? 'text_epigraphy.line' : `t${index}0.line`)
            .groupBy(index === 0 ? 'text_epigraphy.line' : `t${index}0.line`)
            .where('text_epigraphy.text_uuid', textUuid);
        })
      )
    ).flat();

    const lines = rows.map(({ line }) => line).sort((a, b) => a - b);
    return [...new Set(lines)];
  }

  async searchTexts(args: SearchTextArgs): Promise<TextUuidWithLines[]> {
    // List of text UUIDs matching the search
    const textUuids = await this.getMatchingTexts(args);

    // For each text UUID, get a list of lines that match the search
    const textLines = await Promise.all(
      textUuids.map(uuid => this.getMatchingLines(uuid, args.characters))
    );

    return textUuids.map((uuid, index) => ({
      uuid,
      lines: textLines[index],
    }));
  }

  async searchTextsTotal({
    characters,
    title,
    userUuid,
  }: Pick<
    SearchTextArgs,
    'characters' | 'title' | 'userUuid'
  >): Promise<number> {
    const {
      blacklist: textBlacklist,
      whitelist: textWhitelist,
    } = await TextGroupDao.getUserBlacklist(userUuid);
    const {
      blacklist: collectionBlacklist,
    } = await CollectionGroupDao.getUserCollectionBlacklist(userUuid);
    const notUuids = await getNotOccurrenceTexts(characters);

    const totalRows: number = (
      await getSearchQuery(
        characters,
        textBlacklist,
        textWhitelist,
        collectionBlacklist,
        title
      )
        .select(knex.raw('COUNT(DISTINCT text.name) AS count'))
        .whereNotIn('text_epigraphy.text_uuid', notUuids)
        .first()
    ).count;

    return totalRows;
  }

  async searchNullDiscourseCount(
    characterUuids: SearchCooccurrence[],
    userUuid: string | null
  ): Promise<number> {
    const {
      blacklist: textBlacklist,
      whitelist: textWhitelist,
    } = await TextGroupDao.getUserBlacklist(userUuid);
    const {
      blacklist: collectionBlacklist,
    } = await CollectionGroupDao.getUserCollectionBlacklist(userUuid);

    const count = await getSearchQuery(
      characterUuids,
      textBlacklist,
      textWhitelist,
      collectionBlacklist
    )
      .select(knex.raw('COUNT(DISTINCT text_epigraphy.uuid) AS count'))
      .whereNull('text_epigraphy.discourse_uuid')
      .first();

    return count.count;
  }

  async searchNullDiscourse(
    characterUuids: SearchCooccurrence[],
    page: number,
    limit: number,
    userUuid: string | null
  ): Promise<SearchNullDiscourseLine[]> {
    const {
      blacklist: textBlacklist,
      whitelist: textWhitelist,
    } = await TextGroupDao.getUserBlacklist(userUuid);
    const {
      blacklist: collectionBlacklist,
    } = await CollectionGroupDao.getUserCollectionBlacklist(userUuid);

    const epigraphyUuidColumns: string[] = ['text_epigraphy.uuid'];
    characterUuids[0].uuids.forEach((_char, idx) => {
      if (idx > 0) {
        epigraphyUuidColumns.push(`t0${idx}.uuid AS uuid${idx}`);
      }
    });

    const occurrences = await getSearchQuery(
      characterUuids,
      textBlacklist,
      textWhitelist,
      collectionBlacklist
    )
      .distinct(epigraphyUuidColumns)
      .whereNull('text_epigraphy.discourse_uuid')
      .orderBy('text.name')
      .orderBy('text_epigraphy.line')
      .offset((page - 1) * limit)
      .limit(limit);

    const epigraphyOccurrencesUuids: string[][] = occurrences.map(row =>
      Object.values(row)
    );
    const lineInfo = await Promise.all(
      epigraphyOccurrencesUuids.map(uuids =>
        knex('text_epigraphy')
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

  async hasEpigraphy(uuid: string): Promise<boolean> {
    const response = await knex('text_epigraphy')
      .first('uuid')
      .where('text_uuid', uuid);
    return !!response;
  }

  async getAnchorInfo(
    epigraphyUuids: string[],
    textUuid: string
  ): Promise<AnchorInfo> {
    const newWordCharOnTablet: number = (
      await knex('text_epigraphy')
        .whereIn('uuid', epigraphyUuids)
        .pluck('char_on_tablet')
        .orderBy('char_on_tablet', 'asc')
    )[0];
    const isFirstWord = newWordCharOnTablet === 1;
    const direction = !isFirstWord ? '<' : '>';
    const orderBy = !isFirstWord ? 'desc' : 'asc';
    const anchorDiscourseUuid: string = (
      await knex('text_epigraphy')
        .where('text_uuid', textUuid)
        .whereNotNull('discourse_uuid')
        .andWhere(function () {
          this.where('char_on_tablet', direction, newWordCharOnTablet);
        })
        .pluck('discourse_uuid')
        .orderBy('char_on_tablet', orderBy)
    )[0];
    const anchorInfo: AnchorInfo = await knex('text_discourse')
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
    discourseUuid: string
  ): Promise<void> {
    await Promise.all(
      epigraphyUuids.map(epigUuid =>
        knex('text_epigraphy')
          .update('discourse_uuid', discourseUuid)
          .where('uuid', epigUuid)
      )
    );
  }
}

export default new TextEpigraphyDao();

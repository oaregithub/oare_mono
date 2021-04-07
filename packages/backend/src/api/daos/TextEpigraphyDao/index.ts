import _ from 'lodash';
import { EpigraphicUnit, Pagination } from '@oare/types';
import knex from '@/connection';
import {
  getSearchQuery,
  convertEpigraphicUnitRows,
  getSequentialCharacterQuery,
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
  characters: string[][];
  title: string;
  userUuid: string | null;
  pagination: Pagination;
}

export interface AnchorInfo {
  anchorUuid: string;
  anchorDirection: 'up' | 'down';
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

    const matchingTexts: Array<{ uuid: string }> = await getSearchQuery(
      characters,
      title,
      textBlacklist,
      textWhitelist,
      collectionBlacklist
    )
      .select('text_epigraphy.text_uuid AS uuid')
      .orderBy('text.name')
      .groupBy('text.name')
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit);

    return matchingTexts.map(({ uuid }) => uuid);
  }

  private async getMatchingLines(
    textUuid: string,
    characters: string[][]
  ): Promise<number[]> {
    const query = getSequentialCharacterQuery(characters);
    const rows: Array<{ line: number }> = await query
      .distinct('text_epigraphy.line')
      .orderBy('text_epigraphy.line')
      .where('text_epigraphy.text_uuid', textUuid);

    return rows.map(({ line }) => line);
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

    const totalRows: number = (
      await getSearchQuery(
        characters,
        title,
        textBlacklist,
        textWhitelist,
        collectionBlacklist
      )
        .select(knex.raw('COUNT(DISTINCT text.name) AS count'))
        .first()
    ).count;

    return totalRows;
  }

  async hasEpigraphy(uuid: string): Promise<boolean> {
    const response = await knex('text_epigraphy')
      .first('uuid')
      .where('text_uuid', uuid);
    return !!response;
  }

  async getAnchorInfo(
    textEpigraphyUuids: string[]
  ): Promise<AnchorInfo> {
      const textUuid: string = await knex('text_epigraphy')
        .whereIn('uuid', textEpigraphyUuids)
        .pluck('text_uuid AS textUuid')
        .first();
      const newWordCharOnTablet: string = await knex('text_epigraphy')
        .whereIn('uuid', textEpigraphyUuids)
        .pluck('char_on_tablet')
        .first();
      const anchorInfo: AnchorInfo = await knex('text_epigraphy')
        .where('text_uuid', textUuid)
        .whereNotNull('discourse_uuid')
        .andWhere(function () {
          this.where('char_on_tablet', '<', newWordCharOnTablet)
        })
        .pluck('discourse_uuid AS anchorUuid')
        .orderBy('char_on_tablet', 'desc')
        .first();
      if (anchorInfo.anchorUuid) {
        anchorInfo.anchorDirection = 'up';
      }
      else {
      anchorInfo.anchorUuid = await knex('text_epigraphy')
        .where('text_uuid', textUuid)
        .whereNotNull('discourse_uuid')
        .andWhere(function () {
          this.where('char_on_tablet', '>', newWordCharOnTablet)
        })
        .pluck('discourse_uuid')
        .orderBy('char_on_tablet', 'asc')
        .first();
      anchorInfo.anchorDirection = 'down';
      }
    return anchorInfo;
  }
}


export default new TextEpigraphyDao();

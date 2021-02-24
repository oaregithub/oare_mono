import _ from 'lodash';
import { SearchTextsResultRow, EpigraphicUnit } from '@oare/types';
import knex from '@/connection';
import getSearchQuery, { convertEpigraphicUnitRows } from './utils';

export interface EpigraphyReadingRow {
  reading: string;
  line: number;
}
export interface EpigraphicQueryRow extends Omit<EpigraphicUnit, 'side'> {
  side: number;
  epigReading: string;
}

export interface GetEpigraphicUnitsOptions {
  minLine?: number;
  maxLine?: number;
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

    return convertEpigraphicUnitRows(units);
  }

  async totalSearchRows(
    characters: string[],
    textTitle: string,
    blacklist: string[]
  ) {
    const totalRows: number = (
      await getSearchQuery(characters, textTitle, blacklist)
        .select(knex.raw('COUNT(DISTINCT text_epigraphy.text_uuid) AS count'))
        .first()
    ).count;
    return totalRows;
  }

  async searchTexts(
    characters: string[],
    textTitle: string,
    blacklist: string[],
    { page = 1, rows = 10 }
  ): Promise<SearchTextsResultRow[]> {
    // Gets list of texts with their UUIDs that match the query
    const getTextQuery = getSearchQuery(characters, textTitle, blacklist)
      .orderBy('text.name')
      .groupBy('text_epigraphy.text_uuid')
      .limit(rows)
      .offset((page - 1) * rows)
      .select('text_epigraphy.text_uuid AS uuid', 'text.name');
    const texts: SearchTextsResultRow[] = await getTextQuery;

    // For each text, get its surrounding characters as context
    if (characters.length > 0) {
      for (let i = 0; i < texts.length; i += 1) {
        const { uuid } = texts[i];

        const searchEpigraphyQuery = knex('text_epigraphy')
          .where('text_uuid', uuid)
          .andWhereNot('char_on_tablet', null)
          .orderBy('char_on_tablet')
          .select('reading', 'line');

        const epigraphyRows: EpigraphyReadingRow[] = await searchEpigraphyQuery;
        const epigraphyReadings = epigraphyRows.map(row => row.reading);

        // Get all matches in the text
        const numChars = characters.length;
        const matchingLines: number[] = [];
        const matches: string[] = [];
        for (let j = 0; j <= epigraphyRows.length - characters.length; j += 1) {
          if (_.isEqual(epigraphyReadings.slice(j, j + numChars), characters)) {
            // Get the line matching the search result
            const { line } = epigraphyRows[j];
            if (!matchingLines.includes(line)) {
              matchingLines.push(line);
              const lineReading = epigraphyRows
                .filter(row => row.line === line)
                .map(row => row.reading)
                .join(' ');

              matches.push(`${line}. ${lineReading}`);
            }
          }
        }
        texts[i].matches = matches;
      }
    }

    return texts;
  }

  async hasEpigraphy(uuid: string): Promise<boolean> {
    const response = await knex('text_epigraphy')
      .first('uuid')
      .where('text_uuid', uuid);
    return !!response;
  }
}

export default new TextEpigraphyDao();

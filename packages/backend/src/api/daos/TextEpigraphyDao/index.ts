import _ from 'lodash';
import { SearchTextsResultRow } from '@oare/types';
import knex from '../../../connection';
import getSearchQuery, { convertEpigraphicUnitRows } from './utils';
import aliasDao from '../AliasDao';

export interface EpigraphyReadingRow {
  reading: string;
  line: number;
}

export interface EpigraphicBaseUnit {
  uuid: string;
  column: number;
  line: number | null;
  charOnLine: number | null;
  charOnTablet: number | null;
  discourseUuid: string | null;
  reading: string | null;
  type: string | null;
  value: string | null;
}

export interface EpigraphicUnitRow extends EpigraphicBaseUnit {
  side: number;
  epigReading: string;
}

export interface EpigraphicUnitResult extends EpigraphicBaseUnit {
  side: string | null;
}

class TextEpigraphyDao {
  async getEpigraphicUnits(textUuid: string): Promise<EpigraphicUnitResult[]> {
    const units: EpigraphicUnitRow[] = await knex('text_epigraphy')
      .leftJoin('sign_reading', 'text_epigraphy.reading_uuid', 'sign_reading.uuid')
      .where('text_uuid', textUuid)
      .select(
        'text_epigraphy.uuid',
        'text_epigraphy.side',
        'text_epigraphy.column',
        'text_epigraphy.line',
        'text_epigraphy.reading AS epigReading',
        'text_epigraphy.char_on_line AS charOnLine',
        'text_epigraphy.char_on_tablet AS charOnTablet',
        'text_epigraphy.discourse_uuid AS discourseUuid',
        'sign_reading.reading',
        'sign_reading.type',
        'sign_reading.value',
      )
      .orderBy('text_epigraphy.char_on_tablet');

    return convertEpigraphicUnitRows(units);
  }

  async totalSearchRows(characters: string[], textTitle: string, blacklist: string[]) {
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
    { page = 1, rows = 10 },
  ): Promise<SearchTextsResultRow[]> {
    // Gets list of texts with their UUIDs that match the query
    const getTextQuery = getSearchQuery(characters, textTitle, blacklist)
      .orderBy('alias.name')
      .groupBy('text_epigraphy.text_uuid')
      .limit(rows)
      .offset((page - 1) * rows)
      .select('text_epigraphy.text_uuid AS uuid', 'alias.name');
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
        const epigraphyReadings = epigraphyRows.map((row) => row.reading);

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
                .filter((row) => row.line === line)
                .map((row) => row.reading)
                .join(' ');

              matches.push(`${line}. ${lineReading}`);
            }
          }
        }
        texts[i].matches = matches;
      }
    }

    const textNameQueries = texts.map((text) => aliasDao.displayAliasNames(text.uuid));
    const textNames = await Promise.all(textNameQueries);

    texts.forEach((text, index) => {
      text.name = textNames[index]; // eslint-disable-line
    });

    return texts;
  }
}

export default new TextEpigraphyDao();

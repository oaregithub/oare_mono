import * as Knex from 'knex';
import knex from '@/connection';
import { EpigraphicUnit, EpigraphicUnitSide } from '@oare/types';
import { EpigraphicQueryRow } from './index';
import sideNumbers from './sideNumbers';

export function getSequentialCharacterQuery(
  characters: string[],
  baseQuery?: Knex.QueryBuilder
): Knex.QueryBuilder {
  // Join text_epigraphy with itself so that characters can be searched
  // sequentially
  let query = baseQuery || knex('text_epigraphy');
  characters.forEach((char, index) => {
    if (index < 1) {
      return;
    }

    query = query.join(`text_epigraphy AS t${index}`, function () {
      this.on(`t${index}.text_uuid`, 'text_epigraphy.text_uuid')
        .andOn(knex.raw(`t${index}.reading = ?`, char))
        .andOn(
          knex.raw(
            `t${index}.char_on_tablet=text_epigraphy.char_on_tablet + ${index}`
          )
        );
    });
  });

  if (characters.length > 0) {
    query = query.andWhere('text_epigraphy.reading', characters[0]);
  }

  return query;
}

export function getSearchQuery(
  characters: string[],
  textTitle: string,
  textBlacklist: string[],
  textWhitelist: string[],
  collectionBlacklist: string[]
) {
  // Join text table so text names can be returned
  let query = knex('text_epigraphy')
    .join('text', 'text.uuid', 'text_epigraphy.text_uuid')
    .join('hierarchy', 'hierarchy.uuid', 'text_epigraphy.text_uuid');

  query = getSequentialCharacterQuery(characters, query);

  if (textTitle) {
    query = query.andWhere('text.name', 'like', `%${textTitle}%`);
  }

  // Prevents blacklisted texts from appearing in search results (including texts in blacklisted collections)
  query = query.whereNotIn('text_epigraphy.text_uuid', textBlacklist);
  query = query.andWhere(q => {
    q.whereNotIn('hierarchy.parent_uuid', collectionBlacklist).or.whereIn(
      'text_epigraphy.text_uuid',
      textWhitelist
    );
  });

  return query;
}

function mapSideNumberToSideName(side: number): EpigraphicUnitSide {
  return sideNumbers[side] || 'obv.';
}

export function convertEpigraphicUnitRows(
  units: EpigraphicQueryRow[]
): EpigraphicUnit[] {
  return units.map(unit => {
    const mappedUnit: EpigraphicUnit = {
      ...unit,
      side: mapSideNumberToSideName(unit.side),
    };
    if (unit.reading === null) {
      mappedUnit.reading = unit.epigReading;
    } else if (mappedUnit.reading !== mappedUnit.value) {
      mappedUnit.reading = unit.value;
      mappedUnit.type = 'number';
    }

    return mappedUnit;
  });
}

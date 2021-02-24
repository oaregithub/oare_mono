import knex from '@/connection';
import { EpigraphicUnit, EpigraphicUnitSide } from '@oare/types';
import { EpigraphicQueryRow } from './index';
import sideNumbers from './sideNumbers';

export default function getSearchQuery(
  characters: string[],
  textTitle: string,
  blacklist: string[]
) {
  // Join text table so text names can be returned
  let query = knex('text_epigraphy').join(
    'text',
    'text.uuid',
    'text_epigraphy.text_uuid'
  );

  // Join text_epigraphy with itself so that characters can be searched
  // sequentially
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

  // Don't return texts in the user's blacklist
  query = query.where(function () {
    this.whereNotIn('text_epigraphy.text_uuid', blacklist);
  });

  if (characters.length > 0) {
    query = query.andWhere('text_epigraphy.reading', characters[0]);
  }

  if (textTitle !== '') {
    query = query.andWhere('text.name', 'like', `%${textTitle}%`);
  }
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

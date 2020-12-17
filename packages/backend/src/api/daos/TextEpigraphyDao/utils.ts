import knex from '@/connection';
import { EpigraphicUnit } from '@oare/oare';
import { EpigraphicUnitRow, EpigraphicUnitResult } from './index';

export default function getSearchQuery(characters: string[], textTitle: string, blacklist: string[]) {
  // Join alias table so text names can be returned
  let query = knex('text_epigraphy').join('alias', function () {
    this.on('alias.reference_uuid', '=', 'text_epigraphy.text_uuid');
  });

  // Join text_epigraphy with itself so that characters can be searched
  // sequentially
  characters.forEach((char, index) => {
    if (index < 1) {
      return;
    }

    query = query.join(`text_epigraphy AS t${index}`, function () {
      this.on(`t${index}.text_uuid`, 'text_epigraphy.text_uuid')
        .andOn(knex.raw(`t${index}.reading = ?`, char))
        .andOn(knex.raw(`t${index}.char_on_tablet=text_epigraphy.char_on_tablet + ${index}`));
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
    query = query.andWhere('alias.name', 'like', `%${textTitle}%`);
  }
  return query;
}

function mapSideNumberToSideName(side: number): string | null {
  switch (side) {
    case 1:
      return 'obv.';
    case 2:
      return 'lo.e.';
    case 3:
      return 'rev.';
    case 4:
      return 'u.e.';
    case 5:
      return 'le.e.';
    case 6:
      return 'r.e.';
    default:
      return null;
  }
}

export function convertEpigraphicUnitRows(units: EpigraphicUnitRow[]): EpigraphicUnit[] {
  return units
    .map(({ uuid, column, line, charOnLine, charOnTablet, discourseUuid, reading, side, type, value, epigReading }) => {
      const mappedUnit: EpigraphicUnitResult = {
        uuid,
        column,
        line,
        charOnLine,
        charOnTablet,
        discourseUuid,
        reading,
        type,
        value,
        side: null,
      };
      if (reading === null) {
        mappedUnit.reading = epigReading;
      } else if (mappedUnit.reading !== mappedUnit.value) {
        mappedUnit.reading = value;
        mappedUnit.type = 'number';
      }
      mappedUnit.side = mapSideNumberToSideName(side);

      return mappedUnit;
    })
    .filter((item) => item.charOnTablet !== null);
}

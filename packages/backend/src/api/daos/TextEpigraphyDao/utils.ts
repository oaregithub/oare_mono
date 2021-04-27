import * as Knex from 'knex';
import knex from '@/connection';
import {
  EpigraphicUnit,
  EpigraphicUnitSide,
  MarkupUnit,
  SearchCooccurrence,
} from '@oare/types';
import { normalizeFraction, normalizeSign, normalizeNumber } from '@oare/oare';
import { EpigraphicQueryRow } from './index';
import sideNumbers from './sideNumbers';

export function getSequentialCharacterQuery(
  cooccurrences: SearchCooccurrence[],
  baseQuery?: Knex.QueryBuilder
): Knex.QueryBuilder {
  // Join text_epigraphy with itself so that characters can be searched
  // sequentially
  let query = baseQuery || knex('text_epigraphy');
  cooccurrences.forEach((occurrence, coocIndex) => {
    const charSet = occurrence.uuids;
    charSet.forEach((char, charIndex) => {
      if (coocIndex < 1 && charIndex < 1) {
        return;
      }

      query = query.join(
        `text_epigraphy AS t${coocIndex}${charIndex}`,
        function () {
          this.on(
            `t${coocIndex}${charIndex}.text_uuid`,
            'text_epigraphy.text_uuid'
          )
            .andOnIn(`t${coocIndex}${charIndex}.reading_uuid`, char)
            .andOn(
              knex.raw(
                `t${coocIndex}${charIndex}.char_on_tablet=${
                  coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}0`
                }.char_on_tablet + ${charIndex}`
              )
            )
            .andOn(
              knex.raw(
                `t${coocIndex}${charIndex}.line=${
                  coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}0`
                }.line`
              )
            );
        }
      );
    });
    if (coocIndex < 1 && cooccurrences[0].uuids.length > 0) {
      query = query.whereIn(
        'text_epigraphy.reading_uuid',
        cooccurrences[0].uuids[0]
      );
    }
  });

  return query;
}

export function getSearchQuery(
  characters: SearchCooccurrence[],
  textBlacklist: string[],
  textWhitelist: string[],
  collectionBlacklist: string[],
  textTitle?: string
) {
  // Join text table so text names can be returned
  let query = knex('text_epigraphy')
    .join('text', 'text.uuid', 'text_epigraphy.text_uuid')
    .join('hierarchy', 'hierarchy.uuid', 'text_epigraphy.text_uuid');

  const andCooccurrences = characters.filter(char => char.type === 'AND');
  query = getSequentialCharacterQuery(andCooccurrences, query);

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
  units: EpigraphicQueryRow[],
  markupUnits: MarkupUnit[]
): EpigraphicUnit[] {
  return units.map(unit => {
    const unitMarkups = markupUnits.filter(
      markup => markup.referenceUuid === unit.uuid
    );

    const mappedUnit: EpigraphicUnit = {
      ...unit,
      side: mapSideNumberToSideName(unit.side),
      markups: unitMarkups,
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

export const formattedSearchCharacter = (char: string): string[] => {
  // Formats fractions
  char = normalizeFraction(char);

  // Formats subscripts when user puts number at end
  char = normalizeSign(char);

  // Formats numbers
  char = normalizeNumber(char);

  const allChars = char.split(/[\s\-.]+/);
  return allChars;
};

export const stringToCharsArray = (search: string): string[] => {
  const chars = search
    .trim()
    .split(/[\s\-.]+/)
    .flatMap(formattedSearchCharacter);

  if (chars.length === 1 && chars[0] === '') {
    return [];
  }
  return chars;
};

export async function getNotOccurrenceTexts(
  characters: SearchCooccurrence[]
): Promise<string[]> {
  const notCharacters = characters.filter(char => char.type === 'NOT');
  const notTexts =
    notCharacters.length > 0
      ? await getSequentialCharacterQuery(notCharacters).pluck(
          'text_epigraphy.text_uuid'
        )
      : [];
  return notTexts;
}

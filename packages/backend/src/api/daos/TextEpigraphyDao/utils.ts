import { Knex } from 'knex';
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
  includeSuperfluous: boolean,
  respectWordBoundaries: boolean,
  baseQuery?: Knex.QueryBuilder
): Knex.QueryBuilder {
  // Join text_epigraphy with itself so that characters can be searched
  // sequentially
  let query = baseQuery || knex('text_epigraphy');
  query = query.leftJoin(
    'text_markup',
    'text_epigraphy.uuid',
    'text_markup.reference_uuid'
  );
  cooccurrences.forEach((occurrence, coocIndex) => {
    const { words } = occurrence;
    words.forEach((word, wordIndex) => {
      const charSet = word.uuids;
      charSet.forEach((char, charIndex) => {
        let charOffset = 0;
        for (let i = 0; i < words.length && i < wordIndex; i += 1) {
          charOffset += words[i].uuids.length;
        }

        if (coocIndex < 1 && wordIndex < 1 && charIndex < 1) {
          return;
        }

        query = query.join(
          `text_epigraphy AS t${coocIndex}${wordIndex}${charIndex}`,
          function () {
            this.on(
              `t${coocIndex}${wordIndex}${charIndex}.text_uuid`,
              'text_epigraphy.text_uuid'
            )
              .andOnIn(
                `t${coocIndex}${wordIndex}${charIndex}.reading_uuid`,
                char
              )
              .andOn(
                knex.raw(
                  `t${coocIndex}${wordIndex}${charIndex}.char_on_tablet=${
                    coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}00`
                  }.char_on_tablet + ${charIndex + charOffset}`
                )
              )
              .andOn(
                knex.raw(
                  `t${coocIndex}${wordIndex}${charIndex}.line=${
                    coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}00`
                  }.line`
                )
              )
              .andOn(
                knex.raw(
                  `${
                    respectWordBoundaries
                      ? `t${coocIndex}${wordIndex}${charIndex}.discourse_uuid=${
                          coocIndex === 0 && wordIndex === 0
                            ? 'text_epigraphy'
                            : `t${coocIndex}${wordIndex}0`
                        }.discourse_uuid`
                      : '1 = 1'
                  }`
                )
              );
          }
        );
      });
      if (
        coocIndex < 1 &&
        wordIndex < 1 &&
        cooccurrences[0].words[0].uuids.length > 0
      ) {
        query = query.whereIn(
          'text_epigraphy.reading_uuid',
          cooccurrences[0].words[0].uuids[0]
        );
      }
    });
  });
  query = query.modify(qb => {
    if (!includeSuperfluous) {
      qb.andWhere(innerQuery => {
        innerQuery
          .whereNot('text_markup.type', 'superfluous')
          .orWhereNull('text_markup.type');
      });
    }
  });

  return query;
}

export function getSearchQuery(
  characters: SearchCooccurrence[],
  textsToHide: string[],
  includeSuperfluous: boolean,
  respectWordBoundaries: boolean,
  textTitle?: string
) {
  // Join text table so text names can be returned
  let query = knex('text_epigraphy')
    .join('text', 'text.uuid', 'text_epigraphy.text_uuid')
    .join('hierarchy', 'hierarchy.object_uuid', 'text_epigraphy.text_uuid');

  const andCooccurrences = characters.filter(char => char.type === 'AND');
  query = getSequentialCharacterQuery(
    andCooccurrences,
    includeSuperfluous,
    respectWordBoundaries,
    query
  );

  if (textTitle) {
    const finalSearch: string = `%${textTitle
      .replace(/[.,/#!$%^&*;:{}=\-_`~() <>]/g, '%')
      .toLowerCase()}%`;
    query = query.andWhere(function () {
      this.whereRaw('LOWER(text.display_name) LIKE ?', [finalSearch])
        .orWhereRaw('LOWER(text.cdli_num) LIKE ?', [finalSearch])
        .orWhereRaw(
          "LOWER(CONCAT(IFNULL(text.excavation_prfx, ''), ' ', IFNULL(text.excavation_no, ''))) LIKE ?",
          [finalSearch]
        )
        .orWhereRaw(
          "LOWER(CONCAT(IFNULL(text.publication_prfx, ''), ' ', IFNULL(text.publication_no, ''))) LIKE ?",
          [finalSearch]
        )
        .orWhereRaw(
          "LOWER(CONCAT(IFNULL(text.museum_prfx, ''), ' ', IFNULL(text.museum_no, ''))) LIKE ?",
          [finalSearch]
        );
    });
  }

  query = query.whereNotIn('text_epigraphy.text_uuid', textsToHide);

  return query;
}

function mapSideNumberToSideName(
  side: number,
  sideMarkup: MarkupUnit[]
): EpigraphicUnitSide {
  let sideName = sideNumbers[side] || 'obv.';
  if (sideMarkup.map(markup => markup.type).includes('isEmendedReading')) {
    sideName += '!';
  }
  return sideName as EpigraphicUnitSide;
}

export function convertEpigraphicUnitRows(
  units: EpigraphicQueryRow[],
  markupUnits: MarkupUnit[]
): EpigraphicUnit[] {
  return units.map(unit => {
    const sideUnit = units.filter(
      epigUnit => epigUnit.side === unit.side && epigUnit.epigType === 'section'
    )[0];
    const sideMarkup = sideUnit
      ? markupUnits.filter(markup => markup.referenceUuid === sideUnit.uuid)
      : [];

    const unitMarkups = markupUnits.filter(
      markup => markup.referenceUuid === unit.uuid
    );

    const mappedUnit: EpigraphicUnit = {
      ...unit,
      side: mapSideNumberToSideName(unit.side, sideMarkup),
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

  const allChars = char.split(/[\s\-.+]+/);
  return allChars;
};

export const stringToCharsArray = (search: string): string[] => {
  const chars = search
    .trim()
    .split(/[\s\-.+]+/)
    .flatMap(formattedSearchCharacter);

  if (chars.length === 1 && chars[0] === '') {
    return [];
  }
  return chars;
};

export async function getNotOccurrenceTexts(
  characters: SearchCooccurrence[],
  respectWordBoundaries: boolean
): Promise<string[]> {
  const notCharacters = characters.filter(char => char.type === 'NOT');
  const notTexts =
    notCharacters.length > 0
      ? await getSequentialCharacterQuery(
          notCharacters,
          true,
          respectWordBoundaries
        ).pluck('text_epigraphy.text_uuid')
      : [];
  return notTexts;
}

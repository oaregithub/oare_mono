import { Knex } from 'knex';
import knex from '@/connection';
import {
  EpigraphicUnit,
  ItemProperty,
  MarkupUnit,
  SearchCooccurrence,
} from '@oare/types';
import {
  normalizeFraction,
  normalizeSign,
  normalizeNumber,
  convertSideNumberToSide,
} from '@oare/oare';
import sl from '@/serviceLocator';
import { EpigraphicQueryRow } from './index';

// FIXME

export function getSequentialCharacterQuery(
  cooccurrences: SearchCooccurrence[],
  includeSuperfluous: boolean,
  mode: 'respectNoBoundaries' | 'respectBoundaries' | 'respectAllBoundaries',
  baseQuery?: Knex.QueryBuilder,
  trx?: Knex.Transaction
): Knex.QueryBuilder {
  const k = trx || knex;
  // Join text_epigraphy with itself so that characters can be searched
  // sequentially
  let query = baseQuery || k('text_epigraphy');
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
          if (mode === 'respectAllBoundaries') {
            query = query.join('text_epigraphy AS before', function () {
              this.on('before.text_uuid', 'text_epigraphy.text_uuid').andOn(
                k.raw(
                  `(text_epigraphy.char_on_tablet = 1 or (\`before\`.char_on_tablet=${
                    coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}00`
                  }.char_on_tablet - 1 and before.discourse_uuid<>text_epigraphy.discourse_uuid))`
                )
              );
            });
          }
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
                k.raw(
                  `t${coocIndex}${wordIndex}${charIndex}.side=${
                    coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}00`
                  }.side`
                )
              )
              .andOn(
                k.raw(
                  `t${coocIndex}${wordIndex}${charIndex}.char_on_tablet=${
                    coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}00`
                  }.char_on_tablet + ${charIndex + charOffset}`
                )
              )
              .andOn(
                k.raw(
                  `t${coocIndex}${wordIndex}${charIndex}.line=${
                    coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}00`
                  }.line`
                )
              )
              .andOn(
                k.raw(
                  `${
                    mode === 'respectAllBoundaries' ||
                    mode === 'respectBoundaries'
                      ? `t${coocIndex}${wordIndex}${charIndex}.discourse_uuid=${
                          coocIndex === 0 && wordIndex === 0
                            ? 'text_epigraphy'
                            : `t${coocIndex}${wordIndex}0.discourse_uuid and t${coocIndex}${wordIndex}${charIndex}.discourse_uuid <> ${
                                wordIndex === 1
                                  ? 'text_epigraphy'
                                  : `t${coocIndex}${wordIndex - 1}0`
                              }`
                        }.discourse_uuid`
                      : '1 = 1'
                  }`
                )
              );
          }
        );
        if (
          mode === 'respectAllBoundaries' &&
          charIndex === charSet.length - 1 &&
          wordIndex === words.length - 1 &&
          coocIndex === cooccurrences.length - 1
        ) {
          query = query
            .leftJoin('text_epigraphy AS after', function () {
              this.on('after.text_uuid', 'text_epigraphy.text_uuid').andOn(
                k.raw(
                  `after.char_on_tablet=${
                    coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}00`
                  }.char_on_tablet + ${charIndex + charOffset + 1}`
                )
              );
            })
            .where(
              k.raw(
                `IF(after.char_on_tablet is null, 1=1, (after.discourse_uuid<>t${coocIndex}${wordIndex}${charIndex}.discourse_uuid or after.discourse_uuid is null))`
              )
            );
        }
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
  mode: 'respectNoBoundaries' | 'respectBoundaries' | 'respectAllBoundaries',
  textTitle?: string,
  trx?: Knex.Transaction
) {
  const k = trx || knex;
  // Join text table so text names can be returned
  let query = k('text_epigraphy')
    .join('text', 'text.uuid', 'text_epigraphy.text_uuid')
    .join('hierarchy', 'hierarchy.object_uuid', 'text_epigraphy.text_uuid');

  const andCooccurrences = characters.filter(char => char.type === 'AND');
  query = getSequentialCharacterQuery(
    andCooccurrences,
    includeSuperfluous,
    mode,
    query,
    trx
  );

  if (textTitle) {
    const finalSearch: string = ignorePunctuation(textTitle);
    query = query.andWhere(function () {
      this.whereRaw('LOWER(text.display_name) REGEXP ?', [finalSearch])
        .orWhereRaw('LOWER(text.cdli_num) REGEXP ?', [finalSearch])
        .orWhereRaw(
          "LOWER(CONCAT(IFNULL(text.excavation_prfx, ''), ' ', IFNULL(text.excavation_no, ''))) REGEXP ?",
          [finalSearch]
        )
        .orWhereRaw(
          "LOWER(CONCAT(IFNULL(text.publication_prfx, ''), ' ', IFNULL(text.publication_no, ''))) REGEXP ?",
          [finalSearch]
        )
        .orWhereRaw(
          "LOWER(CONCAT(IFNULL(text.museum_prfx, ''), ' ', IFNULL(text.museum_no, ''))) REGEXP ?",
          [finalSearch]
        );
    });
  }

  query = query.whereNotIn('text_epigraphy.text_uuid', textsToHide);

  return query;
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
      side: convertSideNumberToSide(unit.side),
      markups: unitMarkups,
      word: null,
      translation: null,
      parseInfo: null,
      form: null,
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
  mode: 'respectNoBoundaries' | 'respectBoundaries' | 'respectAllBoundaries',
  trx?: Knex.Transaction
): Promise<string[]> {
  const notCharacters = characters.filter(char => char.type === 'NOT');
  const notTexts =
    notCharacters.length > 0
      ? await getSequentialCharacterQuery(
          notCharacters,
          true,
          mode,
          undefined,
          trx
        ).pluck('text_epigraphy.text_uuid')
      : [];
  return notTexts;
}

export function ignorePunctuation(search: string): string {
  const ignoredPunctuation: string = `^.*${search
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()<>]/g, '[.,/#!$%^&*;:{}=-_`~()<>]{0,1}')
    .replace(/[\s]{1,}/g, '([\\s]{1,}|[.,/#!$%^&*;:{}=-_`~()<>]{1,1})')
    .toLowerCase()}.*$`;
  return ignoredPunctuation;
}

export async function getInterlinearInfo(
  units: EpigraphicUnit[]
): Promise<EpigraphicUnit[]> {
  const DictionaryFormDao = sl.get('DictionaryFormDao');
  const DictionarySpellingDao = sl.get('DictionarySpellingDao');
  const DictionaryWordDao = sl.get('DictionaryWordDao');
  const ItemPropertiesDao = sl.get('ItemPropertiesDao');
  const epigraphicUnits: EpigraphicUnit[] = await Promise.all(
    units.map(async (unit, idx) => {
      if (
        unit.charOnLine === 1 ||
        (units[idx - 1] && unit.discourseUuid !== units[idx - 1].discourseUuid)
      ) {
        let word: string | null = null;
        let wordUuid: string | null = null;
        let form: string | null = null;
        let formUuid: string | null = null;
        let translation: string | null = null;
        let parseInfo: ItemProperty[] | null = null;
        if (unit.spellingUuid) {
          formUuid = await DictionarySpellingDao.getFormUuidBySpellingUuid(
            unit.spellingUuid
          );
        }
        if (formUuid) {
          form = (await DictionaryFormDao.getFormByUuid(formUuid)).form;
          wordUuid = await DictionaryFormDao.getDictionaryWordUuidByFormUuid(
            formUuid
          );
          const { type } = await DictionaryWordDao.getDictionaryWordRowByUuid(
            wordUuid
          );
          if (type === 'GN') {
            translation = 'GN';
          } else if (type === 'PN') {
            translation = 'PN';
          } else {
            translation = (
              await DictionaryWordDao.getWordTranslationsForDefinition(wordUuid)
            )[0].val;
          }
          word = await DictionaryWordDao.getWordName(wordUuid);
          parseInfo = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
            formUuid
          );
        }

        return { ...unit, word, form, translation, parseInfo };
      }
      return unit;
    })
  );
  return epigraphicUnits;
}

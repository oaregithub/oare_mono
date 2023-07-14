import { normalizeFraction, normalizeSign, normalizeNumber } from '@oare/oare';
import { SearchCooccurrence, SearchTransliterationMode } from '@oare/types';
import { Knex } from 'knex';
import knex from '@/connection';

/**
 * Normalizes a character for searching.
 * It normalizes fractions, CDLI signs, and numbers.
 * @param char The character to normalize.
 * @returns An array of normalized characters. Can be an array because numbers can be made up of multiple characters.
 */
const formattedSearchCharacter = (char: string): string[] => {
  // Formats fractions
  char = normalizeFraction(char);

  // Formats subscripts when user puts number at end
  char = normalizeSign(char);

  // Formats numbers
  char = normalizeNumber(char);

  const allChars = char.split(/[\s\-.+]+/);

  return allChars;
};

/**
 * Converts a search string to an array of individual characters.
 * @param search The search string.
 * @returns An array of characters.
 */
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

/**
 * Creates a regex string that ignores all punctuation.
 * @param search The original search string.
 * @returns A regex string that ignores all punctuation.
 */
export function ignorePunctuation(search: string): string {
  const ignoredPunctuation: string = `^.*${search
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()<>]/g, '[.,/#!$%^&*;:{}=-_`~()<>]{0,1}')
    .replace(/[\s]{1,}/g, '([\\s]{1,}|[.,/#!$%^&*;:{}=-_`~()<>]{1,1})')
    .toLowerCase()}.*$`;

  return ignoredPunctuation;
}

/**
 * Creates a base query for searching for texts.
 * @param occurrences Array of search cooccurrences.
 * @param textsToHide Array of text UUIDs to hide.
 * @param includeSuperfluous Boolean indicating whether to include superfluous characters.
 * @param mode The search transliteration mode.
 * @param trx Knex Transaction. Optional.
 * @returns Knex QueryBuilder.
 */
export function getSearchQuery(
  occurrences: SearchCooccurrence[],
  textsToHide: string[],
  includeSuperfluous: boolean,
  mode: SearchTransliterationMode,
  trx?: Knex.Transaction
) {
  const k = trx || knex;
  // Join text table so text names can be returned
  let query = k('text_epigraphy').join(
    'text',
    'text.uuid',
    'text_epigraphy.text_uuid'
  );

  const andCooccurrences = occurrences.filter(char => char.type === 'AND');

  query = getSequentialCharacterQuery(
    andCooccurrences,
    includeSuperfluous,
    mode,
    query,
    trx
  );

  query = query.whereNotIn('text.uuid', textsToHide);

  return query;
}

/**
 * Creates a base query for doing a sequential transliteration search.
 * @param cooccurrences Array of search cooccurrences.
 * @param includeSuperfluous Boolean indicating whether to include superfluous characters.
 * @param mode The search transliteration mode.
 * @param baseQuery An optional base query to build upon.
 * @param trx Knex Transaction. Optional.
 * @returns Knex QueryBuilder.
 */
export function getSequentialCharacterQuery(
  cooccurrences: SearchCooccurrence[],
  includeSuperfluous: boolean,
  mode: SearchTransliterationMode,
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

        if (
          coocIndex === 0 &&
          wordIndex === 0 &&
          charIndex === 0 &&
          mode === 'respectAllBoundaries'
        ) {
          query = query.join(`text_epigraphy AS before0`, function () {
            this.on(`before0.text_uuid`, 'text_epigraphy.text_uuid').andOn(
              k.raw(
                `(text_epigraphy.char_on_tablet = 1 or (before0.char_on_tablet=text_epigraphy.char_on_tablet - 1 and before0.discourse_uuid<>text_epigraphy.discourse_uuid))`
              )
            );
          });
        }

        if (coocIndex === 0 && wordIndex === 0 && charIndex === 0) {
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
                            ? 'text_epigraphy.discourse_uuid'
                            : `t${coocIndex}${wordIndex}0.discourse_uuid and ${
                                wordIndex > 0
                                  ? `t${coocIndex}${wordIndex}${charIndex}.discourse_uuid <> ${
                                      coocIndex === 0 && wordIndex === 1
                                        ? 'text_epigraphy.discourse_uuid'
                                        : `t${coocIndex}${
                                            wordIndex - 1
                                          }0.discourse_uuid`
                                    }`
                                  : '1 = 1'
                              }`
                        }`
                      : '1 = 1'
                  }`
                )
              );
          }
        );

        if (
          coocIndex !== 0 &&
          wordIndex === 0 &&
          charIndex === 0 &&
          mode === 'respectAllBoundaries'
        ) {
          query = query.join(
            `text_epigraphy AS before${coocIndex}`,
            function () {
              this.on(
                `before${coocIndex}.text_uuid`,
                'text_epigraphy.text_uuid'
              ).andOn(
                k.raw(
                  `(t${coocIndex}00.char_on_tablet = 1 or (before${coocIndex}.char_on_tablet=t${coocIndex}00.char_on_tablet - 1 and before${coocIndex}.discourse_uuid<>t${coocIndex}00.discourse_uuid))`
                )
              );
            }
          );
        }

        if (
          mode === 'respectAllBoundaries' &&
          charIndex === charSet.length - 1 &&
          wordIndex === words.length - 1
        ) {
          query = query
            .leftJoin(`text_epigraphy AS after${coocIndex}`, function () {
              this.on(
                `after${coocIndex}.text_uuid`,
                'text_epigraphy.text_uuid'
              ).andOn(
                k.raw(
                  `after${coocIndex}.char_on_tablet=${
                    coocIndex === 0 ? 'text_epigraphy' : `t${coocIndex}00`
                  }.char_on_tablet + ${charIndex + charOffset + 1}`
                )
              );
            })
            .where(
              k.raw(
                `IF(after${coocIndex}.char_on_tablet is null, 1=1, (after${coocIndex}.discourse_uuid<>t${coocIndex}${wordIndex}${charIndex}.discourse_uuid or after${coocIndex}.discourse_uuid is null))`
              )
            );
        }
      });

      if (
        coocIndex === 0 &&
        wordIndex === 0 &&
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

/**
 * Performs a transliteration search for 'NOT' coocurrences to get the text UUIDs to exclude.
 * @param occurrences The search cooccurrences.
 * @param mode The search transliteration mode.
 * @param trx Knex Transaction. Optional.
 * @returns An array of text UUIDs to exclude.
 */
export async function getNotOccurrenceTexts(
  occurrences: SearchCooccurrence[],
  mode: SearchTransliterationMode,
  trx?: Knex.Transaction
): Promise<string[]> {
  const notCharacters = occurrences.filter(char => char.type === 'NOT');

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

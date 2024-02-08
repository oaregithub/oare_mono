import {
  normalizeFraction,
  normalizeSign,
  normalizeNumber,
  indexOfFirstVowel,
  subscriptNumber,
} from '@oare/oare';
import { SearchCooccurrence, SearchTransliterationMode } from '@oare/types';
import { Knex } from 'knex';
import knex from '@/connection';
import sl from '@/serviceLocator';

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
          query = query.join('text_epigraphy AS before0', function () {
            this.on('before0.text_uuid', 'text_epigraphy.text_uuid').andOn(
              k.raw(
                '(text_epigraphy.char_on_tablet = 1 or (before0.char_on_tablet=text_epigraphy.char_on_tablet - 1 and before0.discourse_uuid<>text_epigraphy.discourse_uuid))'
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

/**
 * Prepares the characters for searching by applying intellisearch and getting all possible sign readings.
 * @param transliteration The transliteration to search for.
 * @param trx Knex Transaction. Optional.
 * @returns Array of arrays of possible sign readings. Each item in the array is an array of possible readings for each sign.
 * Thus, the number of items in the outer array is equal to the number of signs in the transliteration.
 */
async function prepareIndividualSearchCharacters(
  transliteration?: string,
  trx?: Knex.Transaction
): Promise<string[][]> {
  const SignReadingDao = sl.get('SignReadingDao');

  const charactersArray = transliteration
    ? stringToCharsArray(transliteration)
    : [];
  const signsArray = await applyIntellisearch(charactersArray, trx);

  const characterUuids = await Promise.all(
    signsArray.map(signs =>
      SignReadingDao.getValidSignReadingUuidsByPossibleReadings(signs, trx)
    )
  );
  return characterUuids;
}

/**
 * Prepares the characters for searching by applying intellisearch and getting all possible sign readings.
 * This version supports 'AND' and 'NOT' cooccurrences.
 * @param transliteration The transliteration to search for.
 * @param trx Knex Transaction. Optional.
 * @returns Array of arrays of possible sign readings. Each item in the array is an array of possible readings for each sign.
 * Thus, the number of items in the outer array is equal to the number of signs in the transliteration.
 */
export async function prepareCharactersForSearch(
  transliteration?: string,
  trx?: Knex.Transaction
): Promise<SearchCooccurrence[]> {
  const cooccurrences = transliteration
    ? transliteration.split(';').map(phrase => phrase.trim())
    : [];
  const cooccurrenceTypes = cooccurrences.map(phrase =>
    phrase[0] === '!' ? 'NOT' : 'AND'
  );
  const wordsArray = cooccurrences.map(phrase => phrase.split(' '));
  const cooccurrenceWords = await Promise.all(
    wordsArray.map(words =>
      Promise.all(
        words.map(word => {
          const searchCharacter = word[0] === '!' ? word.slice(1) : word;
          return prepareIndividualSearchCharacters(searchCharacter, trx);
        })
      )
    )
  );

  const characterUuids: SearchCooccurrence[] = cooccurrenceWords.map(
    (cooccurrence, index) => {
      const words = cooccurrence.map(word => ({ uuids: word }));
      return {
        words,
        type: cooccurrenceTypes[index],
      };
    }
  );

  return characterUuids;
}

/**
 * Applies intellisearch to an array of signs.
 * @param signs The signs to apply intellisearch to.
 * @param trx Knex Transaction. Optional.
 * @returns Array of arrays of possible sign readings. Each item in the array is an array of possible readings for each sign.
 */
const applyIntellisearch = async (
  signs: string[],
  trx?: Knex.Transaction
): Promise<string[][]> => {
  let signArray = signs.map(sign => [sign]);

  // Apply Brackets ([])
  signArray = signArray.map(applyBrackets);

  // Apply Consonant Wildcard (C)
  signArray = signArray.map(applyConsonantWildcard);

  // Apply Ampersand Wildcard (&)
  signArray = signArray.map(applyAmpersandWildcard);

  // Apply Dollar Symbol ($)
  signArray = await Promise.all(
    signArray.map(array => applyDollarSymbol(array, trx))
  );

  return signArray;
};

/**
 * Applies the consonant wildcard (C) to an array of signs.
 * This replaces the 'C' with all possible consonants.
 * @param signs The signs to apply the consonant wildcard to.
 * @returns Array of possible signs.
 */
const applyConsonantWildcard = (signs: string[]): string[] => {
  const wildcardConsonants = 'bdgklmnpqrstwyzBDGKLMNPQRSTWYZšṣṭḫṢŠṬḪ'.split('');
  const numberOfWildcards = (signs[0].match(/C/g) || []).length;

  let wildcardSigns: string[] = signs;
  for (let i = 0; i < numberOfWildcards; i += 1) {
    wildcardSigns = wildcardSigns.flatMap(sign =>
      wildcardConsonants.map(consonant => sign.replace('C', consonant))
    );
  }

  return wildcardSigns;
};

/**
 * Applies the ampersand wildcard (&) to an array of signs.
 * This replaces the '&' with all possible accented vowels and subscripted vowels in the sequence.
 * @param signs The signs to apply the ampersand wildcard to.
 * @returns Array of possible signs.
 */
const applyAmpersandWildcard = (signs: string[]): string[] => {
  const beginsWithAmpersand = !!signs[0].match(/^&/);

  let wildcardSigns: string[] = signs;
  if (beginsWithAmpersand) {
    const firstVowelIndex = indexOfFirstVowel(signs[0]);
    const firstVowel = signs[0][firstVowelIndex];

    const accentedVowelOptions = getAccentedVowelOptions(firstVowel);
    const subscriptOptions = getSubscriptVowelOptions();
    wildcardSigns = wildcardSigns.flatMap(sign => {
      const accentedVowels = accentedVowelOptions.map(vowel => {
        const newSign = sign.replace(firstVowel, vowel);
        return newSign.slice(1);
      });
      const subscriptedVowels = subscriptOptions.map(vowel => {
        const newSign = `${sign}${vowel}`;
        return newSign.slice(1);
      });
      return [...accentedVowels, ...subscriptedVowels];
    });
  }
  return wildcardSigns;
};

/**
 * Applies brackets ([]) to an array of signs.
 * This replaces the brackets with all possible characters in the brackets.
 * @param signs The signs to apply the brackets to.
 * @returns Array of possible signs.
 */
const applyBrackets = (signs: string[]): string[] => {
  let bracketSigns: string[] = signs;
  const bracketSubstrings = signs[0].match(/\[[^[]*\]/g) || [];

  // Removes brackets from substring and forms array of possible characters. Ex: '[tm]' => ['t','m']
  const charsInBrackets = bracketSubstrings.map(char =>
    char.slice(1, -1).split('')
  );

  bracketSubstrings.forEach((_, index) => {
    bracketSigns = bracketSigns.flatMap(sign =>
      charsInBrackets[index].map(char => sign.replace(/\[[^[]*\]/, char))
    );
  });
  return bracketSigns;
};

/**
 * Applies the dollar symbol ($) to an array of signs.
 * This allows for searching for all readings of a sign regardless of which reading was supplied.
 * @param signs The signs to apply the dollar symbol to.
 * @param trx Knex Transaction. Optional.
 * @returns Array of possible signs.
 */
const applyDollarSymbol = async (
  signs: string[],
  trx?: Knex.Transaction
): Promise<string[]> => {
  const SignReadingDao = sl.get('SignReadingDao');

  let dollarSigns: string[] = signs;
  const beginsWithDollarSymbol = !!signs[0].match(/^\$/);

  if (beginsWithDollarSymbol) {
    dollarSigns = dollarSigns.map(sign => sign.substr(1));
    dollarSigns = (
      await Promise.all(
        dollarSigns.map(reading =>
          SignReadingDao.getAlternateSignReadings(reading, trx)
        )
      )
    ).flat();
  }
  return dollarSigns;
};

/**
 * Returns various accented vowel options for intellisearch vowel wildcard
 * @param vowel The original vowel that should be wildcarded
 * @returns An array of the various possible accented vowel formats
 */
const getAccentedVowelOptions = (vowel: string): string[] => {
  switch (vowel) {
    case 'A' || 'Á' || 'À':
      return ['A', 'Á', 'À'];
    case 'E' || 'É' || 'È':
      return ['E', 'É', 'È', 'I', 'Í', 'Ì'];
    case 'I' || 'Í' || 'Ì':
      return ['E', 'É', 'È', 'I', 'Í', 'Ì'];
    case 'O' || 'Ó' || 'Ò':
      return ['O', 'Ó', 'Ò'];
    case 'U' || 'Ú' || 'Ù':
      return ['U', 'Ú', 'Ù'];
    case 'a' || 'á' || 'à':
      return ['a', 'á', 'à'];
    case 'e' || 'é' || 'è':
      return ['e', 'é', 'è', 'i', 'í', 'ì'];
    case 'i' || 'í' || 'ì':
      return ['e', 'é', 'è', 'i', 'í', 'ì'];
    case 'o' || 'ó' || 'ò':
      return ['o', 'ó', 'ò'];
    case 'u' || 'ú' || 'ù':
      return ['u', 'ú', 'ù'];
    default:
      return [vowel];
  }
};

/**
 * Simply gets unicode subscripts 4-29. 4 is the minimum possible subscript, 29 is the max.
 * @returns Array of strings containing subscripts 4-29
 */
const getSubscriptVowelOptions = (): string[] => {
  const maxSubscript = 29;
  const subscripts: string[] = [];
  for (let i = 4; i <= maxSubscript; i += 1) {
    const individualNumbers = String(i).split('');
    const subscriptedNumbers = individualNumbers.map(subscriptNumber).join('');
    subscripts.push(subscriptedNumbers);
  }
  return subscripts;
};

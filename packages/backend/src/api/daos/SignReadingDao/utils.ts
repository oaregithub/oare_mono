import { indexOfFirstVowel, subscriptNumber } from '@oare/oare';
import sl from '@/serviceLocator';
import { SearchCooccurrence } from '@oare/types';
import { stringToCharsArray } from '../TextEpigraphyDao/utils';

export async function prepareIndividualSearchCharacters(
  charsPayload?: string
): Promise<string[][]> {
  const SignReadingDao = sl.get('SignReadingDao');

  const charactersArray = charsPayload ? stringToCharsArray(charsPayload) : [];
  const signsArray = await applyIntellisearch(charactersArray);

  const characterUuids = await Promise.all(
    signsArray.map(signs => SignReadingDao.getIntellisearchSignUuids(signs))
  );
  return characterUuids;
}

export async function prepareCharactersForSearch(
  charsPayload?: string
): Promise<SearchCooccurrence[]> {
  const cooccurrences = charsPayload
    ? charsPayload.split(';').map(phrase => phrase.trim())
    : [];
  const cooccurrenceTypes = cooccurrences.map(phrase =>
    phrase[0] === '!' ? 'NOT' : 'AND'
  );
  const preppedCharUuids = await Promise.all(
    cooccurrences.map(char => {
      const searchCharacter = char[0] === '!' ? char.substr(1) : char;
      return prepareIndividualSearchCharacters(searchCharacter);
    })
  );

  const characterUuids: SearchCooccurrence[] = preppedCharUuids.map(
    (uuids, index) => ({
      uuids,
      type: cooccurrenceTypes[index],
    })
  );

  return characterUuids;
}

export const applyIntellisearch = async (
  signs: string[]
): Promise<string[][]> => {
  let signArray = signs.map(sign => [sign]);

  // Apply Brackets ([])
  signArray = signArray.map(applyBrackets);

  // Apply Consonant Wildcard (C)
  signArray = signArray.map(applyConsonantWildcard);

  // Apply Ampersand Wildcard (&)
  signArray = signArray.map(applyAmpersandWildcard);

  // Apply Dollar Symbol ($)
  signArray = await Promise.all(signArray.map(applyDollarSymbol));

  return signArray;
};

export const applyConsonantWildcard = (signs: string[]): string[] => {
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

export const applyAmpersandWildcard = (signs: string[]): string[] => {
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
        return newSign.substr(1);
      });
      const subscriptedVowels = subscriptOptions.map(vowel => {
        const newSign = `${sign}${vowel}`;
        return newSign.substr(1);
      });
      return [...accentedVowels, ...subscriptedVowels];
    });
  }
  return wildcardSigns;
};

export const applyBrackets = (signs: string[]): string[] => {
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

export const applyDollarSymbol = async (signs: string[]): Promise<string[]> => {
  const SignReadingDao = sl.get('SignReadingDao');

  let dollarSigns: string[] = signs;
  const beginsWithDollarSymbol = !!signs[0].match(/^\$/);

  if (beginsWithDollarSymbol) {
    dollarSigns = dollarSigns.map(sign => sign.substr(1));
    dollarSigns = (
      await Promise.all(
        dollarSigns.map(sign => SignReadingDao.getMatchingSigns(sign))
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
export const getAccentedVowelOptions = (vowel: string): string[] => {
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
export const getSubscriptVowelOptions = (): string[] => {
  const maxSubscript = 29;
  const subscripts: string[] = [];
  for (let i = 4; i <= maxSubscript; i += 1) {
    const individualNumbers = String(i).split('');
    const subscriptedNumbers = individualNumbers.map(subscriptNumber).join('');
    subscripts.push(subscriptedNumbers);
  }
  return subscripts;
};

export async function concatenateSignReadingsForSearch(
  searchArray: string[][],
  numCharsInWord: number[]
): Promise<string[]> {
  let result: string[] = [];
  if (searchArray.length === 0) return [];
  if (searchArray.length === 1) return searchArray[0];
  let regex = '^';
  let regexMax = 0;
  let regexMin = 0;
  let charCount = 1;
  for (let i = 0; i < searchArray.length; i += 1) {
    const currentArray = searchArray[i];
    const nextArray = searchArray[i + 1];
    const currentArraySorted = currentArray.sort((a, b) => a.length - b.length);
    regexMin = currentArraySorted[0].length;
    regexMax = currentArraySorted[currentArraySorted.length - 1].length;
    let shift = false;
    if (i < searchArray.length - 1) {
      if (charCount === numCharsInWord[0]) {
        regex += `.{${regexMin},${regexMax}} `;
        shift = true;
      } else {
        regex += `.{${regexMin},${regexMax}}-`;
      }
    }
    if (i === searchArray.length - 1) {
      regex += `.{${regexMin},${regexMax}}$`;
    }
    if (i < 1) {
      for (let x = 0; x < currentArray.length; x += 1) {
        result.push(currentArray[x]);
      }
      for (let f = 0; f < currentArray.length; f += 1) {
        if (i !== searchArray.length - 1) {
          for (let j = 0; j < nextArray.length; j += 1) {
            if (charCount === numCharsInWord[0]) {
              result.push(`${result[f]} ${nextArray[j]}`);
              shift = true;
            } else {
              result.push(`${result[f]}-${nextArray[j]}`);
            }
          }
        }
      }
    } else {
      const resultLength = result.length;
      for (let f = 0; f < resultLength; f += 1) {
        if (i !== searchArray.length - 1) {
          for (let j = 0; j < nextArray.length; j += 1) {
            if (charCount === numCharsInWord[0]) {
              result.push(`${result[f]} ${nextArray[j]}`);
              shift = true;
            } else {
              result.push(`${result[f]}-${nextArray[j]}`);
            }
          }
        }
      }
    }
    charCount += 1;
    if (shift) {
      charCount = 1;
      numCharsInWord.shift();
    }
  }
  const r = RegExp(regex);
  result = result.filter(word => r.test(word));
  return result;
}

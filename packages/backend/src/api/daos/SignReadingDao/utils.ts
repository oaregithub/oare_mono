import { indexOfFirstVowel, subscriptNumber } from '@oare/oare';
import sl from '@/serviceLocator';
import { SearchCooccurrence, SignListReading } from '@oare/types';
import { Knex } from 'knex';
import { stringToCharsArray } from '../TextEpigraphyDao/utils';

export async function prepareIndividualSearchCharacters(
  charsPayload?: string,
  trx?: Knex.Transaction
): Promise<string[][]> {
  const SignReadingDao = sl.get('SignReadingDao');

  const charactersArray = charsPayload ? stringToCharsArray(charsPayload) : [];
  const signsArray = await applyIntellisearch(charactersArray, trx);

  const characterUuids = await Promise.all(
    signsArray.map(signs =>
      SignReadingDao.getIntellisearchSignUuids(signs, trx)
    )
  );
  return characterUuids;
}

export async function prepareCharactersForSearch(
  charsPayload?: string,
  trx?: Knex.Transaction
): Promise<SearchCooccurrence[]> {
  const cooccurrences = charsPayload
    ? charsPayload.split(';').map(phrase => phrase.trim())
    : [];
  const cooccurrenceTypes = cooccurrences.map(phrase =>
    phrase[0] === '!' ? 'NOT' : 'AND'
  );
  const wordsArray = cooccurrences.map(phrase => phrase.split(' '));
  const cooccurrenceWords = await Promise.all(
    wordsArray.map(words =>
      Promise.all(
        words.map(word => {
          const searchCharacter = word[0] === '!' ? word.substr(1) : word;
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

export const applyIntellisearch = async (
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

export const applyDollarSymbol = async (
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
        dollarSigns.map(sign => SignReadingDao.getMatchingSigns(sign, trx))
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

export const sortReadings = (
  signListReading: SignListReading[]
): SignListReading[] =>
  signListReading.sort((a, b) => a.value.localeCompare(b.value));

export async function concatenateReadings(
  signReadingsWithCount: SignListReading[],
  signCount: number,
  allSigns: boolean
): Promise<string> {
  const determinatives = sortReadings(
    signReadingsWithCount.filter(s => s.type === 'determinative')
  )
    .map(
      s =>
        `${
          signCount
            ? `<sup>${s.value}</sup> (${((s.count ?? 0) / signCount).toFixed(
                2
              )})`
            : `${allSigns ? `<sup>${s.value}</sup> (0.0)` : ''}`
        }`
    )
    .join(', ');
  const logograms = sortReadings(
    signReadingsWithCount.filter(s => s.type === 'logogram')
  )
    .map(
      s =>
        `${
          signCount
            ? `${s.value} (${((s.count ?? 0) / signCount).toFixed(2)})`
            : `${allSigns ? `${s.value} (0.0)` : ''}`
        }`
    )
    .join(', ');
  const phonograms = sortReadings(
    signReadingsWithCount.filter(s => s.type === 'phonogram')
  )
    .map(
      s =>
        `${
          signCount
            ? `<em>${s.value}</em> (${((s.count ?? 0) / signCount).toFixed(2)})`
            : `${allSigns ? `<em>${s.value}</em> (0.0)` : ''}`
        }`
    )
    .join(', ');
  const punctuation = sortReadings(
    signReadingsWithCount.filter(s => s.type === 'punctuation')
  )
    .map(
      s =>
        `${
          signCount
            ? `${s.value} (${((s.count ?? 0) / signCount).toFixed(2)})`
            : `${allSigns ? `${s.value} (0.0)` : ''}`
        }`
    )
    .join(', ');
  const numbers = sortReadings(
    signReadingsWithCount.filter(s => s.type === 'number')
  )
    .map(
      s =>
        `${
          signCount
            ? `${s.value} (${((s.count ?? 0) / signCount).toFixed(2)})`
            : `${allSigns ? `${s.value} (0.0)` : ''}`
        }`
    )
    .join(', ');

  const signReadingsConcatenated: string = [
    determinatives,
    logograms,
    phonograms,
    punctuation,
    numbers,
  ]
    .join('<br>')
    .replace(/(<br>){2,}|^(<br>)|(<br>)$/g, '');
  return signReadingsConcatenated;
}

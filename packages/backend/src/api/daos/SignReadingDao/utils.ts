import { indexOfFirstVowel } from '@oare/oare';

export const applyIntellisearch = (signs: string[]): string[][] => {
  let signArray = signs.map(sign => [sign]);

  // Apply Asterisk Wildcard (*)
  signArray = signArray.map(applyAsteriskWildcard);

  // Apply Ampersand Wildcard (&)
  signArray = signArray.map(applyAmpersandWildcard);

  return signArray;
};

export const applyAsteriskWildcard = (signs: string[]): string[] => {
  const wildcardConsonants = 'bdgklmnpqrstwyzBDGKLMNPQRSTWYZšṣṭḫṢŠṬḪ'.split('');
  const numberOfWildcards = (signs[0].match(/\*/g) || []).length;

  let wildcardSigns: string[] = signs;
  for (let i = 0; i < numberOfWildcards; i += 1) {
    wildcardSigns = wildcardSigns.flatMap(sign =>
      wildcardConsonants.map(consonant => sign.replace('*', consonant))
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
    const subscriptedNumbers = individualNumbers
      .map(num => String.fromCharCode(8320 + Number(num)))
      .join('');
    subscripts.push(subscriptedNumbers);
  }
  return subscripts;
};

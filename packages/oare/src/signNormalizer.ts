/**
 * Normalizes sign vowels and consonants. Allows user to add number subscripts and accents
 * Also allows for formatting like other sites
 * @param sign The sign that need to be normalized
 * @returns The correctly normalized sign
 */
export const normalizeSign = (sign: string): string => {
  let normalizedSign = normalizeConsonants(sign);
  normalizedSign = normalizeVowels(normalizedSign);
  return normalizedSign;
};

/**
 * Converts numbers to proper format
 * Ex: 25 -> 2U-5DIŠ, 25AŠ -> 2U-5AŠ, 2 -> 2DIŠ, etc.
 * @param num The sign that may be a number that needs to be normalized
 * @returns The correctly formatted sign, if a number
 */
export const normalizeNumber = (num: string): string => {
  let normalizedNum = num;
  if (num.match(/^\d$/)) {
    normalizedNum = `${normalizedNum.charAt(0)}DIŠ`;
  } else if (num.match(/^\d0$/)) {
    normalizedNum = `${normalizedNum.charAt(0)}U`;
  } else if (num.match(/^\d{2}$/)) {
    normalizedNum = `${normalizedNum.charAt(0)}U-${normalizedNum.charAt(1)}DIŠ`;
  } else if (num.match(/^\d{2}AŠ/)) {
    normalizedNum = `${normalizedNum.charAt(0)}U-${normalizedNum.charAt(1)}AŠ`;
  } else if (num.match(/^\d{2}DIŠ/)) {
    normalizedNum = `${normalizedNum.charAt(0)}U-${normalizedNum.charAt(1)}DIŠ`;
  }
  return normalizedNum;
};

/**
 * If num is a fraction, it will be converted to a unicode character
 */
export const normalizeFraction = (num: string): string => {
  switch (num) {
    case '1/2':
      return '½';
    case '1/3':
      return '⅓';
    case '1/4':
      return '¼';
    case '1/5':
      return '⅕';
    case '1/6':
      return '⅙';
    case '2/3':
      return '⅔';
    case '3/4':
      return '¾';
    case '5/6':
      return '⅚';
    default:
      return num;
  }
};

/**
 * Called if sign ends in 1, 2, or 3. These numbers indicate accentuation rather than subscripting.
 * @param sign The sign that contains a vowel that needs to be accentuated
 * @returns The corrected sign with an accentuated vowel
 */
export const normalizeTilde = (sign: string): string => {
  const firstVowelIndex = indexOfFirstVowel(sign);

  if (firstVowelIndex >= 0) {
    const vowel = sign[firstVowelIndex];
    const number = Number(sign[sign.length - 1]);

    const correctedVowel = normalizeAccentedVowel(vowel, number);
    sign = sign.replace(vowel, correctedVowel);
    sign = sign.slice(0, -1);
  }
  return sign;
};

/**
 * Accentuates first vowel in sign if marked with 1, 2, or 3.
 * Ex: a1 = a, a2 = á, a3 = à
 * @param vowel The vowel that needs to be accentuated
 * @param number The number at the end of the sign. Indicates which accentuation to use
 * @returns Accentuated vowel
 */
export const normalizeAccentedVowel = (
  vowel: string,
  number: number
): string => {
  const idx = number - 1;
  switch (vowel) {
    case 'a':
      return ['a', 'á', 'à'][idx];
    case 'e':
      return ['e', 'é', 'è'][idx];
    case 'i':
      return ['i', 'í', 'ì'][idx];
    case 'o':
      return ['o', 'ó', 'ò'][idx];
    case 'u':
      return ['u', 'ú', 'ù'][idx];
    case 'A':
      return ['A', 'Á', 'À'][idx];
    case 'E':
      return ['E', 'É', 'È'][idx];
    case 'I':
      return ['I', 'Í', 'Ì'][idx];
    case 'O':
      return ['O', 'Ó', 'Ò'][idx];
    case 'U':
      return ['U', 'Ú', 'Ù'][idx];
    default:
      return vowel;
  }
};

/**
 * Converts various consonant forms to normalized unicode form
 * Ex: t,um -> ṭum, szu -> šu
 * @param sign The sign whose consonants will be normalized
 * @returns Sign with converted consonants
 */
export const normalizeConsonants = (sign: string): string => {
  let newSign = sign.replace(/sz/g, 'š');
  newSign = newSign.replace(/s,/g, 'ṣ');
  newSign = newSign.replace(/t,/g, 'ṭ');
  newSign = newSign.replace(/SZ/g, 'Š');
  newSign = newSign.replace(/S,/g, 'Ṣ');
  newSign = newSign.replace(/T,/g, 'Ṭ');
  newSign = newSign.replace(/h/g, 'ḫ');
  newSign = newSign.replace(/H/g, 'Ḫ');
  return newSign;
};

/**
 * Normalized vowel numbers (1-3 are accentuated, 4+ are subscripted)
 * @param sign The sign whose vowels will be normalized
 * @returns Sign with converted vowels
 */
export const normalizeVowels = (sign: string): string => {
  const normalizedSign = sign.split('');

  const isSingleDigitRegex = /^\D+[1-3]$/;
  if (sign.match(isSingleDigitRegex)) {
    return normalizeTilde(sign);
  }

  if (!sign.match(/^\d{1,2}$/)) {
    [1, 2].forEach(negIdx => {
      const signIdx = normalizedSign.length - negIdx;
      if (normalizedSign.length >= negIdx && isDigit(normalizedSign[signIdx])) {
        normalizedSign[signIdx] = subscriptNumber(normalizedSign[signIdx]);
      }
    });
  }

  return normalizedSign.join('');
};

/**
 * Finds the first vowel in a sign for normalizing purposes
 * @param sign The sign that possibly contains a vowel
 * @returns The index of the first vowel in the sign
 */
export const indexOfFirstVowel = (sign: string): number => {
  const splitSign = sign.split('');
  const vowels = 'AÁÀEÉÈIÍÌOÓÒUÚÙaáàeéèiíìoóòuúù'.split('');
  const firstVowel = splitSign.find(char => vowels.includes(char));
  if (firstVowel) {
    return splitSign.indexOf(firstVowel);
  }
  return -1;
};

const isDigit = (char: string): boolean => !!char.match(/^\d$/);

// 8320 is the unicode for subscripted 0
export const subscriptNumber = (normalNumber: string): string =>
  String.fromCharCode(8320 + Number(normalNumber));

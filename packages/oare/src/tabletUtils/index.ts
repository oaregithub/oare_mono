import {
  MarkupType,
  EpigraphicUnit,
  LocaleCode,
  EpigraphicUnitSide,
  TextMarkupRow,
} from '@oare/types';

const superscriptChars = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  Á: 'ᴬ',
  É: 'ᴱ',
  Í: 'ᴵ',
  Ú: 'ᵁ',
  À: 'ᴬ',
  È: 'ᴱ',
  Ì: 'ᴵ',
  Ù: 'ᵁ',
  a: 'ᵃ',
  b: 'ᵇ',
  c: 'ᶜ',
  d: 'ᵈ',
  e: 'ᵉ',
  f: 'ᶠ',
  g: 'ᵍ',
  h: 'ʰ',
  i: 'ⁱ',
  j: 'ʲ',
  k: 'ᵏ',
  l: 'ˡ',
  m: 'ᵐ',
  n: 'ⁿ',
  o: 'ᵒ',
  p: 'ᵖ',
  r: 'ʳ',
  s: 'ˢ',
  t: 'ᵗ',
  u: 'ᵘ',
  v: 'ᵛ',
  w: 'ʷ',
  x: 'ˣ',
  y: 'ʸ',
  z: 'ᶻ',
  A: 'ᴬ',
  B: 'ᴮ',
  D: 'ᴰ',
  E: 'ᴱ',
  G: 'ᴳ',
  H: 'ᴴ',
  Ḫ: 'ᴴ',
  I: 'ᴵ',
  J: 'ᴶ',
  K: 'ᴷ',
  L: 'ᴸ',
  M: 'ᴹ',
  N: 'ᴺ',
  O: 'ᴼ',
  P: 'ᴾ',
  R: 'ᴿ',
  S: 'ˢ',
  Š: 'ˢᶻ',
  T: 'ᵀ',
  U: 'ᵁ',
  V: 'ⱽ',
  W: 'ᵂ',
  X: 'ᵡ',
};

export function getMarkupByDamageType(
  markupRows: TextMarkupRow[],
  damageType: MarkupType
): TextMarkupRow | undefined {
  return markupRows.find(unit => unit.type === damageType);
}

export function unitMatchesDamageType(
  neighbor: EpigraphicUnit,
  markupType: MarkupType
): boolean {
  const match = neighbor.markup.some(m => {
    if (m.type === markupType) {
      return true;
    }
    return false;
  });
  return match;
}

export function separateEpigraphicUnitsByWord(
  characters: EpigraphicUnit[]
): EpigraphicUnit[][] {
  const words: EpigraphicUnit[][] = [];
  let lastDiscourseUuid: string | null = '';
  let curWordIdx = -1;
  characters.forEach((character, idx) => {
    if (lastDiscourseUuid === character.discourseUuid) {
      words[curWordIdx].push(character);
      lastDiscourseUuid = character.discourseUuid;
    } else if (
      characters
        .slice(idx + 1)
        .map(char => char.discourseUuid)
        .includes(lastDiscourseUuid || '')
    ) {
      words[curWordIdx].push(character);
    } else {
      curWordIdx += 1;
      words[curWordIdx] = [character];
      lastDiscourseUuid = character.discourseUuid;
    }
  });
  return words;
}

export function getEpigraphicSeparator(
  sign1: EpigraphicUnit,
  sign2: EpigraphicUnit | null,
  isContraction: boolean
): string {
  if (sign2) {
    if (
      !sign1.markup.map(unit => unit.type).includes('phoneticComplement') &&
      sign2.markup.map(unit => unit.type).includes('phoneticComplement')
    ) {
      return '';
    }
    if (
      sign1.signReadingRow?.type === 'determinative' ||
      sign2.signReadingRow?.type === 'determinative'
    ) {
      return '';
    }
    if (
      sign1.signReadingRow?.type === 'phonogram' ||
      sign2.signReadingRow?.type === 'phonogram'
    ) {
      return '-';
    }
    if (sign1.type === 'number' && sign2.type === 'number') {
      return '+';
    }
    if (
      sign1.signReadingRow?.type === 'logogram' ||
      sign2.signReadingRow?.type === 'logogram'
    ) {
      return '.';
    }
  } else if (isContraction) {
    return '-';
  }
  return '';
}

export function epigraphicWordWithSeparators(
  characters: EpigraphicUnit[],
  isContraction: boolean
): string {
  let wordWithSeparators = '';
  characters.forEach((character, index) => {
    wordWithSeparators += character.reading;
    const nextSign =
      index !== characters.length - 1 ? characters[index + 1] : null;
    wordWithSeparators += getEpigraphicSeparator(
      character,
      nextSign,
      isContraction
    );
  });
  return wordWithSeparators;
}

export function undeterminedReading(unit: EpigraphicUnit): string {
  if (unit.markup.length > 0) {
    const { numValue } = unit.markup[0];

    if (numValue === null) {
      return 'undetermined';
    }
    if (numValue === 1) {
      return '1 broken line';
    }
    return `${numValue} broken lines`;
  }
  return '';
}

export function regionReading(unit: EpigraphicUnit): string {
  if (unit.markup.length > 0) {
    const { type: markupType, numValue } = unit.markup[0];
    const { reading } = unit;

    if (markupType === 'isSealImpression') {
      if (reading === null) {
        return 'Seal Impression';
      }
      return `Seal Impression ${reading}`;
    }

    if (markupType === 'broken') {
      return 'broken';
    }

    if (markupType === 'uninscribed') {
      if (numValue === null) {
        return 'uninscribed';
      }
      if (numValue === 1) {
        return '1 uninscribed line';
      }
      return `${numValue} uninscribed lines`;
    }

    if (markupType === 'ruling') {
      if (numValue === 1) {
        return '---- Single Ruling ----';
      }
      if (numValue === 2) {
        return '---- Double Ruling ----';
      }
      if (numValue === 3) {
        return '---- Triple Ruling ----';
      }
      return '-'.repeat(12);
    }

    if (markupType === 'isStampSealImpression') {
      const valueReading = `(${numValue})`;
      return `Stamp Seal Impression ${reading || ''} ${
        numValue !== null ? valueReading : ''
      }`.trim();
    }
  }
  return '';
}

export function convertMarkedUpUnitsToLineReading(
  characters: EpigraphicUnit[],
  isRegular?: boolean
): string {
  const superscriptedCharacters = characters.map(character =>
    character.signReadingRow?.type === 'determinative' && isRegular
      ? {
          ...character,
          reading: character.reading ? superscript(character.reading) : null,
        }
      : character
  );

  const epigraphicWords = separateEpigraphicUnitsByWord(
    superscriptedCharacters
  );
  return epigraphicWords
    .map(word => {
      const isContraction = getContractionStatus(word);
      return epigraphicWordWithSeparators(word, isContraction);
    })
    .join(' ');
}

export const getContractionStatus = (word: EpigraphicUnit[]): boolean => {
  const spellingUuid = word.map(sign => sign.discourse?.spellingUuid)[0];
  if (
    spellingUuid === '548189514651019744125244140023458311' ||
    spellingUuid === '548385815967702358357593121218684988'
  ) {
    return true;
  }
  return false;
};

export function formatLineNumber(
  lineNum: number,
  includePeriod = true
): string {
  let lineNumber = '';
  if (Number.isInteger(lineNum)) {
    lineNumber = `${lineNum}${includePeriod ? '.' : ''}`;
  } else {
    const numAsString = String(lineNum);
    lineNumber = numAsString.slice(0, numAsString.indexOf('.'));
    const decimalPlaces = numAsString.slice(
      numAsString.indexOf('.'),
      numAsString.indexOf('.') + 3
    );
    const numHyphens = Number(decimalPlaces) * 100;
    for (let i = 0; i < numHyphens; i += 1) {
      lineNumber += "'";
    }
  }
  return lineNumber;
}

export const romanNumeral = (colNum: number): string => {
  let numeral: string = '';
  switch (colNum) {
    case 1:
      numeral = 'i';
      break;
    case 2:
      numeral = 'ii';
      break;
    case 3:
      numeral = 'iii';
      break;
    case 4:
      numeral = 'iv';
      break;
    case 5:
      numeral = 'v';
      break;
    case 6:
      numeral = 'vi';
      break;
    case 7:
      numeral = 'vii';
      break;
    case 8:
      numeral = 'viii';
      break;
    case 9:
      numeral = 'ix';
      break;
    case 10:
      numeral = 'x';
      break;
    default:
      numeral = `${colNum}`;
  }
  return numeral;
};

function superscript(reading: string): string {
  let add2 = false;
  let add3 = false;
  let newReading = reading
    .split('')
    .map(value => {
      let newValue = value;
      if (/[ÁÉÍÚ]/g.test(newValue.toLocaleUpperCase())) {
        add2 = true;
      } else if (/[ÀÈÌÙ]/g.test(newValue.toLocaleUpperCase())) {
        add3 = true;
      }
      if (Object.keys(superscriptChars).includes(newValue)) {
        const idx = Object.keys(superscriptChars).indexOf(newValue);
        newValue = Object.values(superscriptChars)[idx];
      }
      return newValue;
    })
    .join('');
  if (add2) {
    newReading = `${newReading}²`;
  } else if (add3) {
    newReading = `${newReading}³`;
  }
  return newReading;
}

export const localizeString = (string: string, locale: LocaleCode): string => {
  if (locale === 'tr') {
    return string.replace(/I/g, 'İ');
  }

  return string;
};

const sideNumbers: Record<number, EpigraphicUnitSide> = {
  1: 'obv.',
  2: 'lo.e.',
  3: 'rev.',
  4: 'u.e.',
  5: 'le.e.',
  6: 'r.e.',
  7: 'mirror text',
  8: 'legend',
  9: 'suppl. tablet',
  10: 'obv. ii',
};

export const convertSideNumberToSide = (
  sideNum: number
): EpigraphicUnitSide | null => {
  const sideName = sideNumbers[sideNum] || null;
  return sideName;
};

export const convertSideToSideNumber = (side: EpigraphicUnitSide): number => {
  const sideNum = Object.keys(sideNumbers).find(
    key => sideNumbers[Number(key)] === side
  );
  return Number(sideNum);
};

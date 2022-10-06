import {
  MarkupUnit,
  MarkupType,
  EpigraphicUnit,
  EpigraphicUnitWithMarkup,
  EpigraphicUnitType,
  EpigraphicWord,
} from '@oare/types';
import scriptCase from 'script-case';

export function getMarkupByDamageType(
  markupUnits: MarkupUnit[],
  damageType: MarkupType
): MarkupUnit | undefined {
  return markupUnits.find(unit => unit.type === damageType);
}

export function unitMatchesDamageType(
  neighbor: EpigraphicUnit,
  markupType: MarkupType
): boolean {
  if (neighbor.markups) {
    const match = neighbor.markups.some(markup => {
      if (markup.type === markupType) {
        return true;
      }
      return false;
    });
    return match;
  }
  return false;
}

export function separateEpigraphicUnitsByWord(
  characters: EpigraphicUnitWithMarkup[]
): EpigraphicUnitWithMarkup[][] {
  const words: EpigraphicUnitWithMarkup[][] = [];
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
  type1: EpigraphicUnitType | null,
  unit1Markups: MarkupUnit[],
  type2: EpigraphicUnitType | null,
  unit2Markups: MarkupUnit[]
): string {
  if (
    !unit1Markups.map(unit => unit.type).includes('phoneticComplement') &&
    unit2Markups.map(unit => unit.type).includes('phoneticComplement')
  ) {
    return '';
  }
  if (type1 === 'determinative' || type2 === 'determinative') {
    return '';
  }
  if (type1 === 'phonogram' || type2 === 'phonogram') {
    return '-';
  }
  if (type1 === 'number' && type2 === 'number') {
    return '+';
  }
  if (type1 === 'logogram' || type2 === 'logogram') {
    return '.';
  }
  return '';
}

export function epigraphicWordWithSeparators(
  characters: EpigraphicUnitWithMarkup[],
  isContraction: boolean
): string {
  let wordWithSeparators = '';
  characters.forEach((character, index) => {
    wordWithSeparators += character.reading;
    if (index !== characters.length - 1) {
      wordWithSeparators += getEpigraphicSeparator(
        character.type,
        character.markups,
        characters[index + 1].type,
        characters[index + 1].markups
      );
    } else if (isContraction) {
      wordWithSeparators += '-';
    }
  });
  return wordWithSeparators;
}

export function undeterminedReading(unit: EpigraphicUnit): string {
  if (unit.markups.length > 0) {
    const { value: markupValue } = unit.markups[0];

    if (markupValue === null) {
      return 'undetermined';
    }
    if (markupValue === 1) {
      return '1 broken line';
    }
    return `${markupValue} broken lines`;
  }
  return '';
}

export function regionReading(unit: EpigraphicUnit): string {
  if (unit.markups.length > 0) {
    const { type: markupType, value: markupValue } = unit.markups[0];
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
      if (markupValue === null) {
        return 'uninscribed';
      }
      if (markupValue === 1) {
        return '1 uninscribed line';
      }
      return `${markupValue} uninscribed lines`;
    }

    if (markupType === 'ruling') {
      return '-'.repeat(12);
    }

    if (markupType === 'isStampSealImpression') {
      const valueReading = `(${markupValue})`;
      return `Stamp Seal Impression ${reading || ''} ${
        markupValue !== null ? valueReading : ''
      }`.trim();
    }
  }
  return '';
}

export function convertMarkedUpUnitsToLineReading(
  characters: EpigraphicUnitWithMarkup[]
): string {
  const superscriptedCharacters = characters.map(character =>
    character.type !== 'determinative'
      ? character
      : { ...character, reading: scriptCase.superscript(character.reading) }
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

export function convertMarkedUpUnitsToEpigraphicWords(
  characters: EpigraphicUnitWithMarkup[]
): EpigraphicWord[] {
  const epigraphicWords = separateEpigraphicUnitsByWord(characters);
  return epigraphicWords.map(word => {
    const isContraction = getContractionStatus(word);
    return {
      reading: epigraphicWordWithSeparators(word, isContraction),
      discourseUuid: word[0].discourseUuid,
      signs: word.map(({ signUuid, readingUuid, reading }) => ({
        signUuid,
        readingUuid,
        reading,
      })),
      isContraction,
    };
  });
}

export const getContractionStatus = (
  word: EpigraphicUnitWithMarkup[]
): boolean => {
  const spellingUuid = word.map(sign => sign.spellingUuid)[0];
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

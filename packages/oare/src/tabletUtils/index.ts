import {
  MarkupUnit,
  MarkupType,
  EpigraphicUnit,
  EpigraphicUnitWithMarkup,
  EpigraphicUnitType,
  EpigraphicWord,
} from '@oare/types';

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
  type2: EpigraphicUnitType | null
): string {
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
  characters: EpigraphicUnitWithMarkup[]
): string {
  let wordWithSeparators = '';
  characters.forEach((character, index) => {
    wordWithSeparators += character.reading;
    if (index !== characters.length - 1) {
      wordWithSeparators += getEpigraphicSeparator(
        character.type,
        characters[index + 1].type
      );
    }
  });
  return wordWithSeparators;
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
  const epigraphicWords = separateEpigraphicUnitsByWord(characters);
  return epigraphicWords
    .map(word => epigraphicWordWithSeparators(word))
    .join(' ');
}

export function convertMarkedUpUnitsToEpigraphicWords(
  characters: EpigraphicUnitWithMarkup[]
): EpigraphicWord[] {
  const epigraphicWords = separateEpigraphicUnitsByWord(characters);
  return epigraphicWords.map(word => ({
    reading: epigraphicWordWithSeparators(word),
    discourseUuid: word[0].discourseUuid,
    signs: word.map(({ signUuid, readingUuid, reading }) => ({
      signUuid,
      readingUuid,
      reading,
    })),
  }));
}

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

import {
  MarkupUnit,
  MarkupType,
  EpigraphicUnit,
  EpigraphicUnitWithMarkup,
  EpigraphicUnitType,
} from '@oare/types';

export function markupsMatchDamage(
  markupUnits: MarkupUnit[],
  markupType: MarkupType
): boolean {
  return markupUnits.some(markup => {
    if (markup.type === markupType) {
      return true;
    }

    const damageTypes = ['damage', 'partialDamage'];
    if (damageTypes.includes(markup.type)) {
      return true;
    }
    if (damageTypes.includes(markupType)) {
      return true;
    }
    return false;
  });
}

export function getMarkupByDamageType(
  markupUnits: MarkupUnit[],
  damageType: MarkupType
): MarkupUnit | undefined {
  return markupUnits.find(unit => unit.type === damageType);
}

/**
 * markupType is guaranteed to be one of 'damage', 'partialDamage'
 */
export function unitMatchesDamageType(
  neighbor: EpigraphicUnit,
  markupType: MarkupType
): boolean {
  if (neighbor.markups) {
    const match = neighbor.markups.some(markup => {
      if (markup.type === markupType) {
        return true;
      }

      const damages = [markupType, markup.type];
      if (damages.includes('damage')) {
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
  characters.forEach(character => {
    if (lastDiscourseUuid === character.discourseUuid) {
      words[curWordIdx].push(character);
    } else {
      curWordIdx += 1;
      words[curWordIdx] = [character];
    }
    lastDiscourseUuid = character.discourseUuid;
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
  if (unit.markups) {
    // Sort isSealImpression to the top. It's the only region
    // type that can have multiple markups
    unit.markups.sort((a, b) => {
      if (a.type === 'isSealImpression') {
        return -1;
      }
      if (b.type === 'isSealImpression') {
        return 1;
      }
      return 0;
    });

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
      return `${markupValue} ${'-'.repeat(15)}`;
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
  const epigraphicWords: EpigraphicUnitWithMarkup[][] = separateEpigraphicUnitsByWord(
    characters
  );
  return epigraphicWords
    .map(word => epigraphicWordWithSeparators(word))
    .join(' ');
}

import {
  EpigraphicUnit,
  MarkupType,
  EpigraphicUnitType,
  MarkupUnit,
} from './index';

export const isBracket = (char: string): boolean =>
  ['[', ']', '⸢', '⸣'].includes(char);

export const unitMatchesMarkupType = (
  units: EpigraphicUnit[],
  charOnTablet: number,
  markupType: MarkupType,
): boolean => {
  const neighbor = units.find((item) => item.charOnTablet === charOnTablet);

  if (typeof neighbor === 'undefined') {
    return false;
  }

  if (neighbor.markups) {
    const match = neighbor.markups.some((markup) => markup.type === markupType);
    return match;
  }
  return false;
};

export const applyDamageMarkup = (
  units: EpigraphicUnit[],
  reading: string,
  readingType: EpigraphicUnitType,
  markup: MarkupUnit,
  charOnTablet: number,
  isHtml: boolean,
): string => {
  // Phonograms are italicized, need to temporarily remove that HTML
  let formattedReading = reading;
  if (isHtml && readingType === 'phonogram') {
    const exp = /(?<=>)(.*?)(?=<)/;
    const match = reading.match(exp);
    if (match) {
      const [matchReading] = match;
      formattedReading = matchReading;
    }
  }
  const [bracket1, bracket2]: string[] =
    markup.type === 'damage' ? ['[', ']'] : ['⸢', '⸣'];
  let startingBracket = false;

  if (markup.startChar === null) {
    if (!unitMatchesMarkupType(units, charOnTablet - 1, markup.type)) {
      formattedReading = bracket1 + formattedReading;
      startingBracket = true;
    }
  } else {
    formattedReading =
      formattedReading.slice(0, markup.startChar) +
      bracket1 +
      formattedReading.slice(markup.startChar);
    startingBracket = true;
  }

  if (markup.endChar === null) {
    if (!unitMatchesMarkupType(units, charOnTablet + 1, markup.type)) {
      formattedReading += bracket2;
    }
  } else {
    let { endChar } = markup;
    if (startingBracket) {
      endChar += 1;
    }
    formattedReading =
      formattedReading.slice(0, endChar) +
      bracket2 +
      formattedReading.slice(endChar);
  }

  // If phonogram, put the italics back without affecting the brackets
  if (isHtml && readingType === 'phonogram') {
    const unitParts: string[] = [];
    let curWord: string = '';
    formattedReading.split('').forEach((char, idx) => {
      if (isBracket(char)) {
        if (idx > 0) {
          unitParts.push(curWord);
        }
        unitParts.push(char);
        curWord = '';
      } else {
        curWord += char;
      }
    });
    if (curWord !== '') {
      unitParts.push(curWord);
    }

    unitParts.forEach((unit, idx) => {
      if (!isBracket(unit)) {
        unitParts[idx] = `<em>${unitParts[idx]}</em>`;
      }
    });
    formattedReading = unitParts.join('');
  }
  return formattedReading;
};

export const applyMarkup = (
  units: EpigraphicUnit[],
  reading: string,
  readingType: EpigraphicUnitType,
  markups: MarkupUnit[],
  charOnTablet: number,
  isHtml: boolean = false,
) => {
  let formattedReading = reading;
  markups.forEach((markup) => {
    switch (markup.type) {
      case 'isCollatedReading':
        formattedReading += '%';
        break;
      case 'alternateSign':
      case 'isEmendedReading': {
        const suffix: string = isHtml ? '<sup>!</sup>' : '!';
        formattedReading += suffix;
        break;
      }
      case 'erasure':
        formattedReading = `{${formattedReading}}`;
        break;
      case 'isUninterpreted':
        formattedReading = `:${formattedReading}:`;
        break;
      case 'isWrittenWithinPrevSign':
        formattedReading = `×${formattedReading}`;
        break;
      case 'omitted':
        formattedReading = `<${formattedReading}>`;
        break;
      case 'signEmended':
        formattedReading += '!';
        break;
      case 'superfluous':
        formattedReading = `«${formattedReading}»`;
        break;
      case 'uncertain': {
        const suffix: string = isHtml ? '<sup>?</sup>' : '?';
        formattedReading += suffix;
        break;
      }
      case 'isWrittenAsLigature':
        formattedReading = `+${formattedReading}`;
        break;
      case 'undeterminedSigns':
        if (markup.value && markup.value > 0) {
          formattedReading = 'x'.repeat(markup.value);
        }
        break;
      case 'damage':
      case 'partialDamage':
        formattedReading = applyDamageMarkup(
          units,
          reading,
          readingType,
          markup,
          charOnTablet,
          isHtml,
        );
        break;
      case 'isWrittenOverErasure':
        formattedReading = `#${formattedReading}`;
        break;
      default:
        break;
    }
  });
  return formattedReading;
};

/**
 * Get the separator between two characters in a word given their types
 */
export const separator = (
  type1: EpigraphicUnitType,
  type2: EpigraphicUnitType,
): string => {
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
};

/**
 * Return true if units at idx has a character next to it.
 * Used to determine if a separator needs to be inserted
 */
export const hasNeighbor = (
  units: EpigraphicUnit[],
  charOnTablet: number,
): boolean => {
  const curChar: EpigraphicUnit | undefined = units.find(
    (unit) => unit.charOnTablet === charOnTablet,
  );
  const nextChar: EpigraphicUnit | undefined = units.find(
    (unit) => unit.charOnTablet === charOnTablet + 1,
  );

  if (!curChar || !nextChar) return false;

  // Next character must be on same line
  if (curChar.line !== nextChar.line) return false;

  // Next character must be part of same word
  if (curChar.discourseUuid !== nextChar.discourseUuid) return false;

  // Next character cannot be a determinative
  if (nextChar.type === 'determinative') return false;

  return true;
};

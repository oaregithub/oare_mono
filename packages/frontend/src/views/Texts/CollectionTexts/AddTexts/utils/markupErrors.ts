import { EditorMarkup, EditorMarkupError } from '@oare/types';

export type MarkupSymbolPosition = 'start' | 'middle' | 'end';

export const MARKUP_CHARS = [
  '%',
  '{',
  '}',
  ':',
  ';',
  '‹',
  '›',
  '«',
  '»',
  '+',
  'x',
  '⸢',
  '⸣',
  '[',
  ']',
  '!',
  '?',
  '(',
  ')',
  '/',
  '\\',
];

const getBracketErrors = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string,
  allowMarkupWithinSigns = false
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  // Open brackets must be closed
  if (openingSymbol !== closingSymbol) {
    const closingErrors = verifyBracketClosing(
      words,
      openingSymbol,
      closingSymbol,
      typeText
    );
    closingErrors.forEach(error => errors.push(error));
  }

  // Number of opening and closing brackets must match
  if (openingSymbol !== closingSymbol) {
    const matchingBracketErrors = verifyBracketMatching(
      words,
      openingSymbol,
      closingSymbol,
      typeText
    );
    matchingBracketErrors.forEach(error => errors.push(error));
  }

  // Number of brackets must be even when they are identical
  if (openingSymbol === closingSymbol) {
    const identicalBracketErrors = verifyIdenticalBrackets(
      words,
      openingSymbol,
      typeText
    );
    identicalBracketErrors.forEach(error => errors.push(error));
  }

  // Brackets cannot appear within signs (damage and partial damage are exceptions)
  if (!allowMarkupWithinSigns) {
    const bracketIndexErrors = verifyBracketIndex(
      words,
      openingSymbol,
      closingSymbol,
      typeText
    );
    bracketIndexErrors.forEach(error => errors.push(error));
  }

  // Brackets cannot be nested
  const bracketNestingErrors = verifyBracketNesting(
    words,
    openingSymbol,
    closingSymbol,
    typeText
  );
  bracketNestingErrors.forEach(error => errors.push(error));

  return errors;
};

const verifyBracketClosing = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string
): EditorMarkupError[] => {
  let bracketStatus = false;
  let bracketErrorIndex: number | null = null;

  words = words.map(word => word.replace('@', '...'));

  const errors: EditorMarkupError[] = [];

  words.forEach((word, idx) => {
    if (word.includes(openingSymbol)) {
      bracketStatus = true;
      bracketErrorIndex = idx;
    }

    if (word.includes(closingSymbol)) {
      bracketStatus = false;
      bracketErrorIndex = null;
    }
  });

  if (bracketStatus && bracketErrorIndex !== null) {
    errors.push({
      error: `Opening ${typeText.toLowerCase()} bracket does not have a matching closing bracket:`,
      text: words[bracketErrorIndex],
    });
  }
  return errors;
};

const verifyBracketMatching = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const allChars = words.join('').split('');
  const numOpenBracket = allChars.filter(char => char === openingSymbol).length;
  const numClosingBracket = allChars.filter(char => char === closingSymbol)
    .length;
  if (numOpenBracket !== numClosingBracket) {
    errors.push({
      error: `Number of opening and closing ${typeText.toLowerCase()} brackets does not match`,
    });
  }
  return errors;
};

const verifyBracketNesting = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const rowText = words.join(' ');

  let regexp: RegExp;
  if (openingSymbol !== closingSymbol) {
    regexp = new RegExp(
      `\\${openingSymbol}.*\\${openingSymbol}.*\\${closingSymbol}.*\\${closingSymbol}`
    );
  } else {
    regexp = new RegExp(
      `\\${openingSymbol}.*\\${openingSymbol}[\\s]*\\${closingSymbol}.*\\${closingSymbol}`
    );
  }

  const hasNestedBrackets = rowText.match(regexp) || false;
  if (hasNestedBrackets) {
    errors.push({
      text: hasNestedBrackets[0],
      error: `${typeText} brackets cannot be nested: `,
    });
  }

  return errors;
};

const verifyBracketIndex = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const markupCharsToRemove = MARKUP_CHARS.filter(
    char => char !== openingSymbol && char !== closingSymbol
  );

  const dirtySigns = words.flatMap(word => word.split(/[-.+%]+/));
  const signs = dirtySigns.map(sign => {
    const chars = sign.split('');
    const validChars = chars.filter(
      char => !markupCharsToRemove.includes(char)
    );
    return validChars.join('').replace('@', '...');
  });

  if (openingSymbol !== closingSymbol) {
    const signsWithOpeningSymbol = signs.filter(sign =>
      sign.includes(openingSymbol)
    );
    const openingSymbolErrors = signsWithOpeningSymbol.filter(
      sign => !sign.startsWith(openingSymbol)
    );
    openingSymbolErrors.forEach(sign =>
      errors.push({
        text: sign,
        error: `Opening ${typeText.toLowerCase()} bracket should only appear at beginning of sign: `,
      })
    );

    const signsWithClosingSymbol = signs.filter(sign =>
      sign.includes(closingSymbol)
    );
    const closingSymbolErrors = signsWithClosingSymbol.filter(
      sign => !sign.endsWith(closingSymbol)
    );
    closingSymbolErrors.forEach(sign =>
      errors.push({
        text: sign,
        error: `Closing ${typeText.toLowerCase()} bracket should only appear at end of sign: `,
      })
    );
  } else if (openingSymbol === closingSymbol) {
    const signsWithSymbol = signs.filter(sign => sign.includes(openingSymbol));
    const symbolErrors = signsWithSymbol.filter(
      sign => !sign.startsWith(openingSymbol) && !sign.endsWith(openingSymbol)
    );
    symbolErrors.forEach(sign =>
      errors.push({
        text: sign,
        error: `${typeText} brackets should only appear at beginning or the end of a sign: `,
      })
    );
  }

  return errors;
};

const verifyIdenticalBrackets = (
  words: string[],
  symbol: string,
  typeText: string
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const allChars = words.join('').split('');
  const numBrackets = allChars.filter(char => char === symbol).length;
  const isValid = numBrackets % 2 === 0;
  if (!isValid) {
    errors.push({
      error: `Number of opening and closing ${typeText.toLowerCase()} brackets does not match`,
    });
  }

  return errors;
};

const verifyAboveAndBelowSymbols = (words: string[]): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const signs = words
    .flatMap(word => word.split(/[-.+%]+/))
    .map(sign => sign.replace('@', '...'));

  const belowLineSigns = signs.filter(sign => sign.startsWith('/'));
  if (belowLineSigns.length > 1) {
    belowLineSigns.forEach((sign, idx) => {
      if (idx > 0) {
        errors.push({
          text: sign,
          error:
            'Only one "written below line" symbol can be added to a line: ',
        });
      }
    });
  }

  const aboveLineSigns = signs.filter(sign => sign.startsWith('\\'));
  if (aboveLineSigns.length > 1) {
    aboveLineSigns.forEach((sign, idx) => {
      if (idx > 0) {
        errors.push({
          text: sign,
          error:
            'Only one "written above line" symbol can be added to a line: ',
        });
      }
    });
  }

  return errors;
};

const verifySymbolPosition = (
  words: string[],
  symbol: string,
  validPositions: MarkupSymbolPosition[],
  canOnlyBeFollowedBy: string[],
  avoidNumbers = false
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const signs = words
    .flatMap(word => word.split(/[-.+%]+/))
    .map(sign => sign.replace('@', '...'));

  const allPossiblePositions: MarkupSymbolPosition[] = [
    'start',
    'middle',
    'end',
  ];
  const invalidPosiitons = allPossiblePositions.filter(
    position => !validPositions.includes(position)
  );

  if (invalidPosiitons.includes('start')) {
    signs.forEach(sign => {
      if (sign.startsWith(symbol)) {
        errors.push({
          text: sign,
          error: `${symbol} cannot appear at the beginning of a sign: `,
        });
      }
    });
  }

  if (invalidPosiitons.includes('end')) {
    signs.forEach(sign => {
      if (sign.endsWith(symbol)) {
        errors.push({
          text: sign,
          error: `${symbol} cannot appear at the end of a sign: `,
        });
      }
    });
  }

  if (invalidPosiitons.includes('middle')) {
    signs.forEach(sign => {
      if (!avoidNumbers || !sign.match(/\d/)) {
        if (sign.slice(1, sign.length - 1).includes(symbol)) {
          errors.push({
            text: sign,
            error: `${symbol} cannot appear in the middle of a sign: `,
          });
        }
      }
    });
  }

  if (validPositions.includes('middle') && canOnlyBeFollowedBy.length > 0) {
    signs.forEach(sign => {
      const middleOccurrenceIndex = sign
        .slice(1, sign.length - 1)
        .indexOf(symbol);
      if (
        middleOccurrenceIndex >= 0 &&
        !canOnlyBeFollowedBy.includes(
          sign[middleOccurrenceIndex + 1 + symbol.length]
        )
      ) {
        errors.push({
          text: sign,
          error: `${symbol} cannot appear in the middle of a sign`,
        });
      }
    });
  }

  return errors;
};

export const getMarkupContextErrors = async (
  markups: EditorMarkup[],
  word: string
): Promise<EditorMarkupError[]> => {
  const errors: EditorMarkupError[] = [];
  word = word.replace('@', '...');

  const individualMarkups = markups.map(markup =>
    markup.markup.map(piece => piece.type)
  );

  // Original Sign can only be added to isEmendedReading or isCollatedReading
  const originalSignMarkups = individualMarkups.filter(markup =>
    markup.includes('originalSign')
  );
  const originalSignErrors = originalSignMarkups.filter(
    markup =>
      !markup.includes('isCollatedReading') &&
      !markup.includes('isEmendedReading')
  );
  originalSignErrors.forEach(_error =>
    errors.push({
      text: word,
      error:
        'Original signs can only be added to signs marked as emended or collated readings: ',
    })
  );

  // Alternate Sign can only be added to uncertain signs
  const alternateSignMarkups = individualMarkups.filter(markup =>
    markup.includes('alternateSign')
  );
  const alternateSignErrors = alternateSignMarkups.filter(
    markup => !markup.includes('uncertain')
  );
  alternateSignErrors.forEach(_error =>
    errors.push({
      text: word,
      error: 'Alternate signs can only be added to signs marked as uncertain: ',
    })
  );

  // undeterminedSigns of numValue of -1 should only appear in damage, partial, or erasure
  const undeterminedSignsMarkups = markups.filter(markup =>
    markup.markup.map(mark => mark.type).includes('undeterminedSigns')
  );
  const relevantUndeterminedMarkups = undeterminedSignsMarkups.filter(markup =>
    markup.markup.map(mark => mark.numValue).includes(-1)
  );
  const undeterminedSignsErrors = relevantUndeterminedMarkups
    .map(markup => markup.markup.map(piece => piece.type))
    .filter(
      markup =>
        !markup.includes('damage') &&
        !markup.includes('partialDamage') &&
        !markup.includes('erasure')
    );
  undeterminedSignsErrors.forEach(_error =>
    errors.push({
      text: word,
      error:
        'Undetermined signs of an unknown quantity can only be found within areas marked as damaged, partially damaged, or erasures: ',
    })
  );

  return errors;
};

export const getMarkupInputErrors = async (
  rowText: string
): Promise<EditorMarkupError[]> => {
  const determinativeAltMatches = rowText.match(/%((!")|(!!")|(\?'))/g) || [];
  determinativeAltMatches.forEach(match => {
    const newText = match.replace('%', '$');
    rowText = rowText.replace(match, newText);
  });

  const words = rowText.split(/[\s]+/).filter(word => word !== '');
  const errors: EditorMarkupError[] = [];

  // Damage
  const damageBracketErrors = getBracketErrors(words, '[', ']', 'Damage', true);
  damageBracketErrors.forEach(error => errors.push(error));
  const openDamagePositionErrors = verifySymbolPosition(
    words,
    '[',
    ['start', 'middle'],
    []
  );
  openDamagePositionErrors.forEach(error => errors.push(error));
  const closeDamagePositionErrors = verifySymbolPosition(
    words,
    ']',
    ['middle', 'end'],
    []
  );
  closeDamagePositionErrors.forEach(error => errors.push(error));

  // Partial Damage
  const partialDamageBracketErrors = getBracketErrors(
    words,
    '⸢',
    '⸣',
    'Partial damage',
    true
  );
  partialDamageBracketErrors.forEach(error => errors.push(error));
  const openPartialDamagePositionErrors = verifySymbolPosition(
    words,
    '⸢',
    ['start', 'middle'],
    []
  );
  openPartialDamagePositionErrors.forEach(error => errors.push(error));
  const closePartialDamagePositionErrors = verifySymbolPosition(
    words,
    '⸣',
    ['middle', 'end'],
    []
  );
  closePartialDamagePositionErrors.forEach(error => errors.push(error));

  // Superfluous
  const superfluousBracketErrors = getBracketErrors(
    words,
    '«',
    '»',
    'Superfluous'
  );
  superfluousBracketErrors.forEach(error => errors.push(error));

  // Ommitted
  const omittedBracketErrors = getBracketErrors(words, '‹', '›', 'Omitted');
  omittedBracketErrors.forEach(error => errors.push(error));

  // Erasure
  const erasureBracketErrors = getBracketErrors(words, '{', '}', 'Erasure');
  erasureBracketErrors.forEach(error => errors.push(error));

  // Uninterpreted
  const uninterpretedErrors = getBracketErrors(
    words,
    ':',
    ':',
    'Uninterpreted'
  );
  uninterpretedErrors.forEach(error => errors.push(error));

  // isWrittenOverErasure
  const writtenOverErasureErrors = getBracketErrors(
    words,
    '*',
    '*',
    'Written over erasure'
  );
  writtenOverErasureErrors.forEach(error => errors.push(error));

  // phoneticComplement
  const phoneticComplementErrors = getBracketErrors(
    words,
    ';',
    ';',
    'Phonetic complement'
  );
  phoneticComplementErrors.forEach(error => errors.push(error));

  // originalSign
  const originalSignBracketErrors = getBracketErrors(
    words,
    '"',
    '"',
    'Original sign'
  );
  originalSignBracketErrors.forEach(error => errors.push(error));

  // alternateSign
  const alternateSignBracketErrors = getBracketErrors(
    words,
    "'",
    "'",
    'Alternate sign'
  );
  alternateSignBracketErrors.forEach(error => errors.push(error));

  // isWrittenAboveLine and isWrittenBelowLine
  const aboveAndBelowErrors = verifyAboveAndBelowSymbols(words);
  aboveAndBelowErrors.forEach(error => errors.push(error));
  const writtenBelowErrors = verifySymbolPosition(
    words,
    '/',
    ['start'],
    [],
    true
  );
  writtenBelowErrors.forEach(error => errors.push(error));
  const writtenAboveErrors = verifySymbolPosition(
    words,
    '\\',
    ['start'],
    [],
    true
  );
  writtenAboveErrors.forEach(error => errors.push(error));

  // Uncertain
  const uncertainPositionErrors = verifySymbolPosition(
    words,
    '?',
    ['middle', 'end'],
    ["'", '!']
  );
  uncertainPositionErrors.forEach(error => errors.push(error));

  // isEmendedReading
  const emendedPositionErrors = verifySymbolPosition(
    words,
    '!',
    ['middle', 'end'],
    ['"', '!', '?']
  );
  emendedPositionErrors.forEach(error => errors.push(error));

  // isCollatedReading
  const collatedPositionErrors = verifySymbolPosition(
    words,
    '!!',
    ['middle', 'end'],
    ['"', '?']
  );
  collatedPositionErrors.forEach(error => errors.push(error));

  return errors;
};

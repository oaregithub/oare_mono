import { RawToken, NormalizedRawToken, Token } from '@oare/types';
import grammar from './spellingGrammar';
import { normalizeSign, normalizeFraction } from './signNormalizer';

const Jison = require('jison');

export const separateTokenPhrases = (tokens: Token[]): Token[][] => {
  const phrases: Token[][] = [];
  let curPhrase: Token[] = [];
  tokens.forEach(token => {
    if (token.tokenType === 'SPACE') {
      phrases.push([...curPhrase]);
      curPhrase = [];
    } else {
      curPhrase.push(token);
    }
  });
  phrases.push([...curPhrase]);
  return phrases;
};

const normalizeRawTokens = (rawTokens: RawToken[]): NormalizedRawToken[] =>
  rawTokens.map(({ tokenName: [tokenType], tokenText }) => ({
    tokenType,
    tokenText,
  }));

export const isNumberSign = (tokenText: string): boolean => {
  const fullNumbers = [
    '1/2',
    '1/3',
    '1/4',
    '1/5',
    '1/6',
    '2/3',
    '3/4',
    '5/6',
    '½',
    '⅓',
    '¼',
    '⅕',
    '⅙',
    '⅔',
    '¾',
    '⅚',
    'LÁ',
  ];
  const decimalRegex = /^\d+(\.\d+)?$/;
  return fullNumbers.includes(tokenText) || !!tokenText.match(decimalRegex);
};

export const isNumberPhrase = (tokens: Token[]): boolean => {
  const separators = tokens.filter(({ tokenType }) => tokenType === '+');
  const signs = tokens.filter(({ tokenType }) => tokenType === 'NUMBER');

  return (
    separators.length + signs.length ===
    tokens.filter(({ tokenType }) => tokenType !== '$end').length
  );
};

export const isSignPhraseWithNumber = (tokens: Token[]): boolean => {
  if (tokens.length > 0 && tokens[0].tokenType === 'NUMBER') {
    const separators = tokens.filter(
      ({ tokenType }) => tokenType === '-' || tokenType === '.'
    );
    const signs = tokens.filter(({ tokenType }) => tokenType === 'SIGN');

    return (
      separators.every(
        ({ tokenType }) => tokenType === separators[0].tokenType
      ) &&
      separators.length + signs.length ===
        tokens.filter(({ tokenType }) => tokenType !== '$end').length - 1
    ); // -1 for first token
  }
  return false;
};

export const isComplementPhrase = (tokens: Token[]): boolean =>
  tokens.some(({ tokenType }) => tokenType === '{');

export const isLogogramNumberPhrase = (tokens: Token[]): boolean => {
  const separators = tokens.filter(({ tokenType }) => tokenType === '.');
  const signs = tokens.filter(
    ({ tokenType }) => tokenType === 'SIGN' || tokenType === 'NUMBER'
  );

  return (
    separators.every(
      ({ tokenType }) => tokenType === separators[0].tokenType
    ) &&
    signs.some(({ tokenType }) => tokenType === 'SIGN') &&
    signs.some(({ tokenType }) => tokenType === 'NUMBER') &&
    separators.length + signs.length ===
      tokens.filter(({ tokenType }) => tokenType !== '$end').length
  );
};

/**
 * Checks that damage brackets match, and other markup that has
 * two characters matches
 */
export const hasValidMarkup = (tokens: Token[]): boolean => {
  const dualCharacterMap = {
    '*': '*',
    ':': ':',
    '‹': '›',
    '«': '»',
    '[': ']',
    '⸢': '⸣',
  };

  const reading = tokens.map(({ tokenText }) => tokenText).join('');

  const markupValid = Object.entries(dualCharacterMap).reduce(
    (valid, [startChar, endChar]) => {
      if (!valid) {
        return false;
      }

      let seenStart = false;
      let bracketsValid = true;
      reading.split('').forEach(char => {
        if (!bracketsValid) {
          return;
        }

        if (!seenStart) {
          if (char === startChar) {
            seenStart = true;
          } else if (char === endChar) {
            bracketsValid = false;
          }
        } else {
          if (char === startChar) {
            bracketsValid = false;
          } else if (char === endChar) {
            seenStart = false;
          }
        }
      });

      return seenStart ? false : bracketsValid;
    },
    true
  );

  return markupValid;
};

const validName = (tokens: Token[]): boolean => {
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    // This won't go out of bounds since the grammar itself
    // would catch it before this function would even be called
    if (token.tokenType === '=' && tokens[i + 2].tokenText !== 'd') {
      return false;
    }
  }
  return true;
};

const isValidGrammar = (tokens: Token[], acceptMarkup = false) => {
  // If there are numbers, they must be separated by a + or appear
  // only at the beginning of a sign
  if (
    tokens.some(({ tokenText }) => isNumberSign(tokenText)) &&
    !isComplementPhrase(tokens)
  ) {
    return (
      isNumberPhrase(tokens) ||
      isSignPhraseWithNumber(tokens) ||
      isLogogramNumberPhrase(tokens)
    );
  }

  const markupCharacters = '*:×‹«+#⸢⸣[]!›»?'.split('');

  if (
    !acceptMarkup &&
    tokens
      .map(({ tokenText }) => tokenText)
      .join('')
      .split('')
      .some(char => markupCharacters.includes(char))
  ) {
    return false;
  }

  if (acceptMarkup && !hasValidMarkup(tokens)) {
    return false;
  }

  // Make sure = sign are always followed by (d)
  if (tokens.some(({ tokenType }) => tokenType === '=') && !validName(tokens)) {
    return false;
  }

  return true;
};

export interface TokenizeSpellingOptions {
  acceptMarkup: boolean;
}

export const tokenizeExplicitSpelling = (
  spelling: string,
  options: TokenizeSpellingOptions = { acceptMarkup: false }
): Token[] => {
  const parser = new Jison.Parser(grammar);
  const rawTokens: RawToken[] = [];
  Jison.lexDebugger = rawTokens;
  parser.parse(spelling.trim());

  const normalizedRawTokens: Token[] = normalizeRawTokens(rawTokens).map(
    ({ tokenType, tokenText }) => ({
      tokenType: isNumberSign(tokenText) ? 'NUMBER' : tokenType,
      tokenText,
    })
  );

  const phrases = separateTokenPhrases(normalizedRawTokens);
  if (!phrases.every(tokens => isValidGrammar(tokens, options.acceptMarkup))) {
    throw new Error('Invalid grammar');
  }

  return normalizedRawTokens;
};

export const spellingHtmlReading = (
  spelling: string,
  options: TokenizeSpellingOptions = { acceptMarkup: false }
): string => {
  if (!spelling) {
    return '';
  }

  try {
    const tokens = tokenizeExplicitSpelling(spelling, options);
    return tokens
      .filter(({ tokenType }) => tokenType !== '$end')
      .map(({ tokenType, tokenText }, index) => {
        if (tokenType === 'SIGN') {
          const sign = normalizeSign(tokenText);
          if (index > 0) {
            const { tokenText: prevToken } = tokens[index - 1];
            if (prevToken === '(' || prevToken === '{') {
              return `<sup>${sign}</sup>`;
            }
          }
          return sign === sign.toLowerCase() ? `<em>${sign}</em>` : sign;
        }
        if (tokenType === 'DETSEPARATOR') {
          return '<sup>.</sup>';
        }
        if (tokenType === 'COMPSEPARATOR') {
          return '<sup>-</sup>';
        }
        if (tokenType === 'SPACE') {
          return '&nbsp;';
        }
        if (tokenType === '=') {
          return '-';
        }

        if (tokenType === 'NUMBER') {
          return normalizeFraction(tokenText);
        }
        if (['SIGN', '+', '.', '-'].includes(tokenType)) {
          return tokenText;
        }
        return '';
      })
      .join('');
  } catch (e) {
    return `<mark style="background-color: #ffb3b3">${spelling}</mark>`;
  }
};

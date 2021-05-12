import fs from 'fs';
import path from 'path';
import { RawToken, NormalizedRawToken, Token } from '@oare/types';
import bnf from './spellingGrammar';
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

const isValidGrammar = (tokens: Token[]) => {
  // If there are numbers, they must be separated by a + or appear
  // only at the beginning of a sign
  if (
    tokens.some(({ tokenText }) => isNumberSign(tokenText)) &&
    !isComplementPhrase(tokens)
  ) {
    return isNumberPhrase(tokens) || isSignPhraseWithNumber(tokens);
  }

  return true;
};

export const tokenizeExplicitSpelling = (spelling: string): Token[] => {
  const grammar = fs.readFileSync(
    path.join(__dirname, './spellingGrammar.jison'),
    {
      encoding: 'utf8',
    }
  );
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
  if (!phrases.every(isValidGrammar)) {
    throw new Error('Invalid grammar');
  }

  return phrases.flat();
};

export const spellingHtmlReading = (spelling: string): string => {
  if (!spelling) {
    return '';
  }

  try {
    const tokens = tokenizeExplicitSpelling(spelling);
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
          return ' ';
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

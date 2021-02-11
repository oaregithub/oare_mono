import { Token } from '@oare/types';
import bnf from './spellingGrammar';

const Jison = require('jison');

const parser = new Jison.Parser(bnf);

export const tokenizeExplicitSpelling = (spelling: string): Token[] => {
  const tokens: Token[] = [];
  Jison.lexDebugger = tokens;

  parser.parse(spelling.trim());
  return tokens;
};

const isDigit = (char: string): boolean => !!char.match(/^\d$/);

// 8320 is the unicode for subscripted 0
const subscriptNumber = (normalNumber: string): string =>
  String.fromCharCode(8320 + Number(normalNumber));

export const normalizeSign = (sign: string): string => {
  const normalizedSign = sign.split('');
  [1, 2].forEach(negIdx => {
    const signIdx = normalizedSign.length - negIdx;
    if (normalizedSign.length >= negIdx && isDigit(normalizedSign[signIdx])) {
      normalizedSign[signIdx] = subscriptNumber(normalizedSign[signIdx]);
    }
  });

  return normalizedSign.join('');
};

/**
 * If num is a fraction, it will be converted to a unicode character
 */
export const normalizeNumber = (num: string): string => {
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

export const spellingHtmlReading = (spelling: string): string => {
  if (!spelling) {
    return '';
  }

  try {
    const tokens = tokenizeExplicitSpelling(spelling);
    return tokens
      .filter(({ tokenName: [tokenType] }) => tokenType !== '$end')
      .map(({ tokenName: [tokenType], tokenText }, index) => {
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
          return normalizeNumber(tokenText);
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

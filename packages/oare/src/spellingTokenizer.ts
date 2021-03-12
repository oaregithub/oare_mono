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
  let normalizedSign = sign.split('');
  const lastIdx = normalizedSign.length - 1;
  const penultimateIdx = normalizedSign.length - 2;

  const isSingleDigit =
    isDigit(normalizedSign[lastIdx]) &&
    !isDigit(normalizedSign[penultimateIdx]);
  if (isSingleDigit) {
    if (normalizedSign[lastIdx].match(/^[1-3]$/)) {
      normalizedSign = normalizeTilde(normalizedSign);
      return normalizedSign.join('');
    }
  }

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

export const normalizeTilde = (splitSign: string[]): string[] => {
  const firstVowelIndex = indexOfFirstVowel(splitSign);

  if (firstVowelIndex >= 0) {
    const vowel = splitSign[firstVowelIndex];
    const number = Number(splitSign[splitSign.length - 1]);

    const correctedVowel = normalizeVowel(vowel, number);
    splitSign[firstVowelIndex] = correctedVowel;
    splitSign.pop();
  }

  return splitSign;
};

export const normalizeVowel = (vowel: string, number: number): string => {
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
      return ['U', 'Ú', 'Ú'][idx];
    default:
      return vowel;
  }
};

export const indexOfFirstVowel = (splitSign: string[]): number => {
  const vowels = ['A', 'E', 'I', 'O', 'U', 'a', 'e', 'i', 'o', 'u'];
  const firstVowel = splitSign.find(char => vowels.includes(char));
  if (firstVowel) {
    return splitSign.indexOf(firstVowel);
  }
  return -1;
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

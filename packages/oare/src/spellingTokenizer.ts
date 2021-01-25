import bnf from './spellingGrammar';

const Jison = require('jison');

const parser = new Jison.Parser(bnf);

type TokenType =
  | 'NUMBER'
  | 'SIGN'
  | 'SPACE'
  | '+'
  | '.'
  | '-'
  | 'DETSEPARATOR'
  | 'COMPSEPARATOR'
  | '('
  | ')'
  | '{'
  | '}'
  | '$end';

export interface Token {
  tokenName: TokenType[];
  tokenText: string;
}

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
  [1, 2].forEach((negIdx) => {
    const signIdx = normalizedSign.length - negIdx;
    if (normalizedSign.length >= negIdx && isDigit(normalizedSign[signIdx])) {
      normalizedSign[signIdx] = subscriptNumber(normalizedSign[signIdx]);
    }
  });

  return normalizedSign.join('');
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
        if (['NUMBER', 'SIGN', '+', '.', '-'].includes(tokenType)) {
          return tokenText;
        }
        return '';
      })
      .join('');
  } catch (e) {
    return `<mark style="background-color: #ffb3b3">${spelling}</mark>`;
  }
};

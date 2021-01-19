// import fs from 'fs';
// import path from 'path';
import bnf from './spellingGrammar';

const Jison = require('jison');

// const bnf = fs.readFileSync(
//   path.join(__dirname, '..', 'src', 'spellingGrammar.jison'),
//   'utf-8',
// );

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

interface Token {
  tokenName: TokenType[];
  tokenText: string;
}

export const tokenizeExplicitSpelling = (spelling: string): Token[] => {
  const tokens: Token[] = [];
  Jison.lexDebugger = tokens;

  parser.parse(spelling.trim());
  return tokens;
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
          if (index > 0) {
            const { tokenText: prevToken } = tokens[index - 1];
            if (prevToken === '(' || prevToken === '{') {
              return `<sup>${tokenText}</sup>`;
            }
          }
          return tokenText === tokenText.toLowerCase()
            ? `<em>${tokenText}</em>`
            : tokenText;
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
  } catch {
    return `<mark style="background-color:red">${spelling}</mark>`;
  }
};

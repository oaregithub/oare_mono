import fs from 'fs';
import path from 'path';

const Jison = require('jison');

const bnf = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'spellingGrammar.jison'),
  'utf-8',
);

const parser = new Jison.Parser(bnf);

type TokenType = 'NUMBER' | 'SIGN' | 'SPACE' | 'PLUS' | 'SEPARATOR' | '$end';

interface Token {
  tokenName: TokenType[];
  tokenText: string;
}

export const tokenizeExplicitSpelling = (spelling: string): Token[] => {
  const tokens: Token[] = [];
  Jison.lexDebugger = tokens;
  parser.parse(spelling);

  console.log(tokens);
  return tokens;
};

export const spellingHtmlReading = (spelling: string): string =>
  tokenizeExplicitSpelling(spelling)
    .filter(({ tokenName: [tokenType] }) => tokenType !== '$end')
    .map(({ tokenName: [tokenType], tokenText }) => {
      if (tokenType === 'SIGN') {
        return tokenText === tokenText.toLowerCase()
          ? `<em>${tokenText}</em>`
          : tokenText;
      }
      if (
        ['NUMBER', 'SIGN', 'SPACE', 'PLUS', 'SEPARATOR'].includes(tokenType)
      ) {
        return tokenText;
      }
      return tokenText;
    })
    .join('');

export type TokenType =
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

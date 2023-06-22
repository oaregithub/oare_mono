// COMPLETE

export type RawTokenType =
  | 'SIGN'
  | 'SPACE'
  | '+'
  | '.'
  | '-'
  | '='
  | 'DETSEPARATOR'
  | 'COMPSEPARATOR'
  | '('
  | ')'
  | '{'
  | '}'
  | '$end';

export type TokenType = RawTokenType | 'NUMBER';

interface BaseToken {
  tokenText: string;
}

export interface RawToken extends BaseToken {
  tokenName: RawTokenType[];
}

export interface NormalizedRawToken extends BaseToken {
  tokenType: RawTokenType;
}

export interface Token extends BaseToken {
  tokenType: TokenType;
}

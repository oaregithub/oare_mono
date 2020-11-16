/**
 * Grammar for a spelling:
 *
 * SPELLING -> GROUP(SEPARATOR GROUP)*  (no space between separator and group)
 * GROUP -> SYLLABLE|SUPERSCRIPT
 * SUPERSCRIPT -> \(SYLLABLE\)
 * SYLLABLE -> LETTER+
 * LETTER -> a-zA-Z
 * SEPARATOR -> .|-
 */

type TokenType = 'SYLLABLE' | 'SUPERSCRIPT' | 'SEPARATOR';
type State = null | 'READ_SUPERSCRIPT' | 'READ_SYLLABLE';

type Token = {
  classifier: TokenType;
  reading: string;
};

export const tokenize = (spelling: string): Token[] => {
  let state: State = null;
  let reading = '';
  const tokens: Token[] = [];
  const eof = String.fromCharCode(-1);

  spelling
    .concat(eof)
    .split('')
    .forEach(char => {
      switch (state) {
        case null:
          if (char === '(') {
            state = 'READ_SUPERSCRIPT';
          } else {
            state = 'READ_SYLLABLE';
            reading += char;
          }
          break;
        case 'READ_SUPERSCRIPT':
          if (char === ')' || char === eof) {
            tokens.push({
              classifier: 'SUPERSCRIPT',
              reading,
            });
            reading = '';
            state = null;
          } else {
            reading += char;
          }
          break;
        case 'READ_SYLLABLE':
          if (char === '.' || char === '-') {
            tokens.push({
              classifier: 'SYLLABLE',
              reading,
            });
            tokens.push({
              classifier: 'SEPARATOR',
              reading: char,
            });
            reading = '';
            state = null;
          } else if (char === '(' || char === eof) {
            tokens.push({
              classifier: 'SYLLABLE',
              reading,
            });
            reading = '';
            state = 'READ_SUPERSCRIPT';
          } else {
            reading += char;
          }
          break;
      }
    });
  return tokens;
};

export const spellingHtmlReading = (spelling: string): string => {
  return tokenize(spelling)
    .map(token => {
      if (token.classifier === 'SUPERSCRIPT') {
        return `<sup>${token.reading}</sup>`;
      } else if (token.classifier === 'SYLLABLE') {
        if (token.reading === token.reading.toLowerCase()) {
          return `<em>${token.reading}</em>`;
        } else {
          return token.reading;
        }
      } else {
        return token.reading;
      }
    })
    .join('');
};

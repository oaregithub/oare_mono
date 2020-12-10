import { tokenizeExplicitSpelling, spellingHtmlReading } from '../src/index';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveErrorToken(): CustomMatcherResult;
    }
  }
}
describe('tokenizer', () => {
  it('correctly tokenizes', () => {
    expect(tokenizeExplicitSpelling('(TÚG)a-bar-ni-ú')).toEqual([
      { classifier: 'SUPERSCRIPT', reading: 'TÚG' },
      { classifier: 'SYLLABLE', reading: 'a' },
      { classifier: 'SEPARATOR', reading: '-' },
      { classifier: 'SYLLABLE', reading: 'bar' },
      { classifier: 'SEPARATOR', reading: '-' },
      { classifier: 'SYLLABLE', reading: 'ni' },
      { classifier: 'SEPARATOR', reading: '-' },
      { classifier: 'SYLLABLE', reading: 'ú' },
    ]);
  });

  it('returns HTML reading', () => {
    expect(spellingHtmlReading('(TÚG)a-bar-ni-ú')).toBe(
      '<sup>TÚG</sup><em>a</em>-<em>bar</em>-<em>ni</em>-<em>ú</em>',
    );
  });

  it('throws error with unmatched opening parenthesis', () => {
    expect(tokenizeExplicitSpelling('(TÚGa-bar-ni-ú')).toHaveErrorToken();
  });

  it('throws error with unmatched closing parenthesis', () => {
    expect(tokenizeExplicitSpelling('TÚG)a-bar-ni-ú')).toHaveErrorToken();
  });

  it('throws error with separators at beginning', () => {
    expect(tokenizeExplicitSpelling('-bar-ni-ú')).toHaveErrorToken();
    expect(tokenizeExplicitSpelling('.bar-ni-ú')).toHaveErrorToken();
  });

  it('throws error with separator at end', () => {
    expect(tokenizeExplicitSpelling('(TÚG)a-bar-ni-')).toHaveErrorToken();
    expect(tokenizeExplicitSpelling('(TÚG)a-bar-ni.')).toHaveErrorToken();
  });

  it('throws error with multiple separators', () => {
    expect(tokenizeExplicitSpelling('a-bar--ni')).toHaveErrorToken();
  });

  it('parses numbers', () => {
    expect(tokenizeExplicitSpelling('8+0.5')).not.toHaveErrorToken();
  });

  it('allows superscripts at end of spelling', () => {
    expect(tokenizeExplicitSpelling('a-bar-ni-ú(TÚG)')).not.toHaveErrorToken();
  });

  it('converts numbers at end of characters to subscripted number', () => {
    const tokens = tokenizeExplicitSpelling('bi4');
    expect(tokens[0].reading).toBe('bi₄');
  });
});

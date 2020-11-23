import { tokenizeExplicitSpelling, spellingHtmlReading } from '../src/index';

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
});

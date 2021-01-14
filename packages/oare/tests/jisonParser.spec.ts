import {
  tokenizeExplicitSpelling,
  spellingHtmlReading,
} from '../src/spellingTokenizer';

describe('spelling grammar test', () => {
  it('parses number phrase', () => {
    tokenizeExplicitSpelling('3');
    tokenizeExplicitSpelling('1+4');
    tokenizeExplicitSpelling('0.333+4+0.5');
    tokenizeExplicitSpelling('1+LÁ+0.3');
  });

  it('errors on incorrect decimals', () => {
    expect(() => tokenizeExplicitSpelling('0.0.3')).toThrow();
  });

  it('errors on incorrect plus signs', () => {
    expect(() => tokenizeExplicitSpelling('1++3')).toThrow();
  });

  it('errors when adding non-number to number', () => {
    expect(() => tokenizeExplicitSpelling('4+KIŠIB'));
  });

  it('returns html spelling for signs', () => {
    expect(spellingHtmlReading('ab-ša-ra-ni')).toBe(
      '<em>ab</em>-<em>ša</em>-<em>ra</em>-<em>ni</em>',
    );
  });

  it('returns html spelling for number phrases', () => {
    expect(spellingHtmlReading('0.5+LÁ')).toBe('0.5+LÁ');
  });
});

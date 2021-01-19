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

  it('parses signs with spaces', () => {
    tokenizeExplicitSpelling('áb   ša-ra-nim');
  });

  it('parses phrases with determinatives', () => {
    tokenizeExplicitSpelling('(TÚG)a-bar-ni-ú');
    tokenizeExplicitSpelling('a-bar-ni-ú(TÚG)');
    tokenizeExplicitSpelling('(TÚG)(.)(HI)(.)(A)ku-ta-ni');
    tokenizeExplicitSpelling('(m)(d)UTU.DÙG');
    tokenizeExplicitSpelling('(m)(d)a-bar(m)(d)');
  });

  it('errors on improper separator placement', () => {
    expect(() => tokenizeExplicitSpelling('(.)(HI)ku-ta-ni')).toThrow();
    expect(() => tokenizeExplicitSpelling('(TUG)(.)ku-ta-ni')).toThrow();
  });

  it('errors on determinatives in the wrong spot', () => {
    expect(() => tokenizeExplicitSpelling('ku(di)ta-ni')).toThrow();
    expect(() => tokenizeExplicitSpelling('KIŠIB(ki)-šu')).toThrow();
  });

  it('errors on lone determinative phrases', () => {
    expect(() => tokenizeExplicitSpelling('(m)(d)')).toThrow();
  });

  it('parses complement phrases', () => {
    tokenizeExplicitSpelling('É{bé}{-}{et}');
    tokenizeExplicitSpelling('10{eš₁₅}{-}{ra}{-}{at}');
    tokenizeExplicitSpelling('É{be}{-}{ta}-tí-ni');
    tokenizeExplicitSpelling('1{iš}{-}{té}-tù-ma');
  });

  it('correct html reading for determinants', () => {
    expect(spellingHtmlReading('(TÚG)a-bar')).toBe(
      '<sup>TÚG</sup><em>a</em>-<em>bar</em>',
    );
  });
});

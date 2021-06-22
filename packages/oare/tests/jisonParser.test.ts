import { Token } from '@oare/types';
import {
  tokenizeExplicitSpelling,
  spellingHtmlReading,
  separateTokenPhrases,
  isNumberSign,
  hasValidMarkup,
  isLogogramNumberPhrase,
} from '../src/spellingTokenizer';

describe('spelling grammar test', () => {
  it.each(['3', '1+4', '0.333+4+0.5', '1+LÁ+0.3'])(
    'parses number phrase %s',
    (numPhrase: string) => {
      tokenizeExplicitSpelling(numPhrase);
    }
  );

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
      '<em>ab</em>-<em>ša</em>-<em>ra</em>-<em>ni</em>'
    );
  });

  it('returns html spelling for number phrases', () => {
    expect(spellingHtmlReading('0.5+LÁ')).toBe('0.5+LÁ');
  });

  it('parses signs with spaces', () => {
    tokenizeExplicitSpelling('áb ša-ra-nim');
  });

  it('errors on repeated separators', () => {
    expect(() => tokenizeExplicitSpelling('ša--qá-lu-um')).toThrow();
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

  it('errors on sign phrase in determinative', () => {
    expect(() =>
      tokenizeExplicitSpelling('(TÚG.ḪI.A)ba-ad-de-te-er-mi-na-ti-ve')
    ).toThrow();
  });

  it('errors on lone determinative phrases', () => {
    expect(() => tokenizeExplicitSpelling('(m)(d)')).toThrow();
  });

  it.each([
    'É{bé}{-}{et}',
    '10{eš₁₅}{-}{ra}{-}{at}',
    'É{be}{-}{ta}-tí-ni',
    '1{iš}{-}{té}-tù-ma',
  ])('parses complement phrases (%s)', phrase => {
    tokenizeExplicitSpelling(phrase);
  });

  it('errors on dangling complement separator', () => {
    expect(() => tokenizeExplicitSpelling('ra{-}{at}')).toThrow();
  });

  it('correct html reading for determinants', () => {
    expect(spellingHtmlReading('(TÚG)a-bar')).toBe(
      '<sup>TÚG</sup><em>a</em>-<em>bar</em>'
    );
  });

  it('requires digit in front of decimal', () => {
    expect(() => tokenizeExplicitSpelling('5+10+.033')).toThrow();
  });

  it('converts normal numbers to small numbers', () => {
    expect(spellingHtmlReading('eš15-ra-at')).toBe(
      '<em>eš₁₅</em>-<em>ra</em>-<em>at</em>'
    );
    expect(spellingHtmlReading('(d)PUZUR4-IŠTAR')).toBe(
      '<sup>d</sup>PUZUR₄-IŠTAR'
    );
  });

  it('parses fractional numbers', () => {
    tokenizeExplicitSpelling('1/2+3');
    tokenizeExplicitSpelling('5/6+0.333');
  });

  it('rejects invalid fractions', () => {
    expect(() => tokenizeExplicitSpelling('3/5')).toThrow();
    expect(() => tokenizeExplicitSpelling('1/7')).toThrow();
  });

  it('converts fractions to unicode', () => {
    expect(spellingHtmlReading('1/3+4')).toBe('⅓+4');
    expect(spellingHtmlReading('5+2/3')).toBe('5+⅔');
  });

  it.each(['9-tí-iš-e-šu-šu', '1.PÚZUR.IŠTAR', '10-ri-šu'])(
    'parses numbers at beginning of alphabetic phrase (%s)',
    phrase => {
      tokenizeExplicitSpelling(phrase);
    }
  );

  it.each(['9-tí.ITI', '10.ITI-tí'])(
    'catches invalid number phrase (%s)',
    phrase => {
      expect(() => tokenizeExplicitSpelling(phrase)).toThrow();
    }
  );
  it('normalizes vowels 1-3', () => {
    expect(spellingHtmlReading('tam1')).toBe('<em>tam</em>');
    expect(spellingHtmlReading('tam2')).toBe('<em>tám</em>');
    expect(spellingHtmlReading('tam3')).toBe('<em>tàm</em>');
    expect(spellingHtmlReading('TAM1')).toBe('TAM');
    expect(spellingHtmlReading('TAM2')).toBe('TÁM');
    expect(spellingHtmlReading('TAM3')).toBe('TÀM');
  });

  it('normalizes foreign consonants', () => {
    expect(spellingHtmlReading('szu')).toBe('<em>šu</em>');
    expect(spellingHtmlReading('s,u')).toBe('<em>ṣu</em>');
    expect(spellingHtmlReading('t,um')).toBe('<em>ṭum</em>');
    expect(spellingHtmlReading('hu')).toBe('<em>ḫu</em>');
    expect(spellingHtmlReading('SZU')).toBe('ŠU');
    expect(spellingHtmlReading('S,U')).toBe('ṢU');
    expect(spellingHtmlReading('T,UM')).toBe('ṬUM');
    expect(spellingHtmlReading('HU')).toBe('ḪU');
  });

  it('catches number phrase mixed with sign phrase', () => {
    expect(() => tokenizeExplicitSpelling('2+0.3-a-na')).toThrow();
  });

  it('parses numbers inside logogram expressions', () => {
    tokenizeExplicitSpelling('ITU.3.KAM');
  });
});

describe('utility tests', () => {
  describe('separateRawTokenPhrases', () => {
    it('separates raw tokens by spaces', () => {
      const rawTokens: Token[] = [
        {
          tokenType: 'SIGN',
          tokenText: 'ab',
        },
        {
          tokenType: '-',
          tokenText: '-',
        },
        {
          tokenType: 'SIGN',
          tokenText: 'na',
        },
        {
          tokenType: 'SPACE',
          tokenText: ' ',
        },
        {
          tokenType: 'SIGN',
          tokenText: 'na',
        },
        {
          tokenType: '$end',
          tokenText: '',
        },
      ];

      expect(separateTokenPhrases(rawTokens)).toStrictEqual([
        [
          {
            tokenType: 'SIGN',
            tokenText: 'ab',
          },
          {
            tokenType: '-',
            tokenText: '-',
          },
          {
            tokenType: 'SIGN',
            tokenText: 'na',
          },
        ],
        [
          {
            tokenType: 'SIGN',
            tokenText: 'na',
          },
          {
            tokenType: '$end',
            tokenText: '',
          },
        ],
      ]);
    });
  });

  describe('isNumberSign', () => {
    it.each([
      '1/2',
      '1/3',
      '1/4',
      '1/5',
      '1/6',
      '2/3',
      '3/4',
      '5/6',
      '½',
      '⅓',
      '¼',
      '⅕',
      '⅙',
      '⅔',
      '¾',
      '⅚',
      'LÁ',
    ])('recognizes %s as a number', (num: string) => {
      expect(isNumberSign(num)).toBe(true);
    });

    it.each(['0.3', '15', '12.4', '2'])('recognizes %s as a number', num => {
      expect(isNumberSign(num)).toBe(true);
    });

    it.each(['abc', '03a', '0.0.3'])('knows %s is not a number', num => {
      expect(isNumberSign(num)).toBe(false);
    });
  });

  describe('valid markup tests', () => {
    it('returns true for tokens with valid markup', () => {
      const tokens: Token[] = [
        { tokenType: 'SIGN', tokenText: '[a' },
        { tokenType: '-', tokenText: '-' },
        { tokenType: 'SIGN', tokenText: 'na]' },
        { tokenType: '$end', tokenText: '' },
      ];
      expect(hasValidMarkup(tokens)).toBe(true);
    });

    it('returns false for mismatched opening bracket', () => {
      const tokens: Token[] = [
        { tokenType: 'SIGN', tokenText: '⸢a' },
        { tokenType: '-', tokenText: '-' },
        { tokenType: 'SIGN', tokenText: 'na' },
        { tokenType: '$end', tokenText: '' },
      ];

      expect(hasValidMarkup(tokens)).toBe(false);
    });

    it('returns false for mismatched closing bracket', () => {
      const tokens: Token[] = [
        { tokenType: 'SIGN', tokenText: 'a' },
        { tokenType: '-', tokenText: '-' },
        { tokenType: 'SIGN', tokenText: 'na⸣' },
        { tokenType: '$end', tokenText: '' },
      ];

      expect(hasValidMarkup(tokens)).toBe(false);
    });

    it('returns false for duplicate open bracket', () => {
      const tokens: Token[] = [
        { tokenType: 'SIGN', tokenText: '⸢a⸢' },
        { tokenType: '-', tokenText: '-' },
        { tokenType: 'SIGN', tokenText: 'na⸣' },
        { tokenType: '$end', tokenText: '' },
      ];

      expect(hasValidMarkup(tokens)).toBe(false);
    });

    it('returns true for readings without markup', () => {
      const tokens: Token[] = [
        { tokenType: 'SIGN', tokenText: 'a' },
        { tokenType: '-', tokenText: '-' },
        { tokenType: 'SIGN', tokenText: 'na' },
        { tokenType: '$end', tokenText: '' },
      ];

      expect(hasValidMarkup(tokens)).toBe(true);
    });
  });

  describe('isLogogramNumberPhrase', () => {
    it('returns true for logogram number phrases', () => {
      const tokens: Token[] = [
        { tokenType: 'SIGN', tokenText: 'ITU' },
        { tokenType: '.', tokenText: '.' },
        { tokenType: 'NUMBER', tokenText: '2' },
        { tokenType: '.', tokenText: '.' },
        { tokenType: 'SIGN', tokenText: 'KAM' },
      ];

      expect(isLogogramNumberPhrase(tokens)).toBe(true);
    });

    it('returns false if the phrase does not have a sign', () => {
      const tokens: Token[] = [
        { tokenType: 'NUMBER', tokenText: '0' },
        { tokenType: '.', tokenText: '.' },
        { tokenType: 'NUMBER', tokenText: '0' },
        { tokenType: '.', tokenText: '.' },
        { tokenType: 'NUMBER', tokenText: '2' },
      ];
      expect(isLogogramNumberPhrase(tokens)).toBe(false);
    });

    it('returns false if the phrase does not have a number', () => {
      const tokens: Token[] = [
        { tokenType: 'SIGN', tokenText: 'ITI' },
        { tokenType: '.', tokenText: '.' },
        { tokenType: 'SIGN', tokenText: 'KAM' },
      ];
      expect(isLogogramNumberPhrase(tokens)).toBe(false);
    });
  });
});

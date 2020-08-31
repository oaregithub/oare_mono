import { createTabletRenderer, TabletRenderer } from '../src/index';
import { endsWithSuperscript, wordWithoutSuperscript } from '../src/TabletHtmlRenderer';
import units from '../mock/units';
import markupUnits from '../mock/markups';
import anor67units from '../mock/anor67units';
import anor67markups from '../mock/anor67markups';

describe('Tablet renderer', () => {
  let renderer: TabletRenderer;
  beforeEach(() => {
    renderer = createTabletRenderer(units, markupUnits);
  });

  test('correctly returns sides', () => {
    const { sides } = renderer;
    expect(sides).toEqual(['obv.', 'rev.']);
  });

  test('correctly returns lines on side', () => {
    // Lines 1..23
    const obvLines = (new Array(23)).fill(null).map((_, i) => i + 1);
    // Lines 24..38
    const revLines = (new Array(15)).fill(null).map((_, i) => i + 24);

    expect(renderer.linesOnSide('obv.')).toEqual(obvLines);
    expect(renderer.linesOnSide('rev.')).toEqual(revLines);
  });

  test('correct line reading', () => {
    const lineReading = '[ḫa-ru-mu]-tim GÁN-lam e-tí-[qú]';
    expect(renderer.lineReading(38)).toBe(lineReading);
  });

  test('correct side', () => {
    const reading = `KIŠIB pì-lá-aḫ-a-šur DUMU a-šur-na-da
KIŠIB a-šur-ták-lá-ku DUMU e-na-ni-a
KIŠIB šu-a-šur DUMU i-na-aḫ-DINGIR
1 ma-na KÙ.BABBAR ṣa-ru-pá-am
i-ṣé-er šu-a-šur DAM.GÀR i-šu
iš-tù ḫa-muš-tim ša i-dí-a-bi₄-im
#ITI.#1.#KAM kán-mar-ta li-mu-um
en-na-sú-en₆ DUMU IḪ.ME
NIŠ.2 ḫa-am-ša-tim i-ša-qal
šu-ma lá iš-qúl 1+0.5 GÍN.TA
a-na 1 ma-na-im i #ITI.#1.#KAM
ṣí-ib-tám ú-ṣa-áb wa-bi-il₅
ṭup-pí-im šu-ut DAM.GÀR
[me-eḫ]-ru-um ša ṭup-pé-e
[ḫa-ru-mu]-tim GÁN-lam e-tí-[qú]`;
    expect(renderer.sideReading('rev.')).toBe(reading);
  });

  test('correct tablet reading', () => {
    const reading = `obv.
KIŠIB ku-ku-zi DUMU ṣé-eḫ-ri-ì-lí
KIŠIB LUGAL-sú-en₆ DUMU ma-ni-a
KIŠIB na-áb-sú-en₆ DUMU šu-be-lim
NIŠ.7 ma-na KÙ.BABBAR ṣa-ru-pá-am i-ṣé-er
na-áb-sú-en₆ a-šur-ma-lik
i-šu iš-tù ḫa-muš-tim ša i-dí-a-bi₄-im
ITI.1.KAM ku-zal-lu li-mu-um i-na-a
a-na 10 ḫa-am-ša-tim i-ša-qal
šu-ma lá iš-qúl 1+0.5 GÍN.TA a-na
1 ma-na-im ṣí-ib-tám i ITI.KAM
ù-ṣa-áb KÙ.BABBAR ú lu-qú-tum a-šu-mì
a-šur-ma-lik GÁN-lam e-tí-iq
DAM.GÀR ú-lá i-qí-áp KIŠIB na-zi
DUMU a-mu-ru-ba-ni KIŠIB lá-qé-ep
DUMU PÚZUR-sa-du-e KIŠIB LUGAL-sú-en₆
DUMU ma-ni-a 0.833333333 ma-na KÙ.BABBAR
ṣa-ru-pá-am i-ṣé-er LUGAL-sú-en₆
DUMU ma-ni-[a] DAM.GÀR i-šu iš-tù
ḫa-muš-tim ša i-dí-a-bi₄-im
a-na 4 [ḫa]-am-ša-tim i-ša-qal
šu-ma lá iš-qúl 1+0.5 GÍN.TA
a-na 1 ma-na-im i #ITI.#1.#KAM
ṣí-ib-tám ú-ṣa-áb

rev.
KIŠIB pì-lá-aḫ-a-šur DUMU a-šur-na-da
KIŠIB a-šur-ták-lá-ku DUMU e-na-ni-a
KIŠIB šu-a-šur DUMU i-na-aḫ-DINGIR
1 ma-na KÙ.BABBAR ṣa-ru-pá-am
i-ṣé-er šu-a-šur DAM.GÀR i-šu
iš-tù ḫa-muš-tim ša i-dí-a-bi₄-im
#ITI.#1.#KAM kán-mar-ta li-mu-um
en-na-sú-en₆ DUMU IḪ.ME
NIŠ.2 ḫa-am-ša-tim i-ša-qal
šu-ma lá iš-qúl 1+0.5 GÍN.TA
a-na 1 ma-na-im i #ITI.#1.#KAM
ṣí-ib-tám ú-ṣa-áb wa-bi-il₅
ṭup-pí-im šu-ut DAM.GÀR
[me-eḫ]-ru-um ša ṭup-pé-e
[ḫa-ru-mu]-tim GÁN-lam e-tí-[qú]`;
    expect(renderer.tabletReading()).toBe(reading);
  });
});

describe('line number renderer', () => {
  let renderer: TabletRenderer;
  beforeEach(() => {
    renderer = createTabletRenderer(units, markupUnits, {
      lineNumbers: true,
    });
  });

  test('it shows line numbers', () => {
    const reading = '1. KIŠIB ku-ku-zi DUMU ṣé-eḫ-ri-ì-lí';
    expect(renderer.lineReading(1)).toBe(reading);
  });
});

describe('html renderer', () => {
  let renderer: TabletRenderer;
  beforeEach(() => {
    renderer = createTabletRenderer(units, markupUnits, {
      textFormat: 'html',
    });
  });

  test('it renders with html', () => {
    const reading = 'KIŠIB <em>k</em><em>u</em>-<em>k</em><em>u</em>-<em>z</em><em>i</em> DUMU <em>ṣ</em><em>é</em>-<em>e</em><em>ḫ</em>-<em>r</em><em>i</em>-<em>ì</em>-<em>l</em><em>í</em>';
    expect(renderer.lineReading(1)).toBe(reading);
  });

  describe('ends with superscript', () => {
    test('finds match with exclamation', () => {
      expect(endsWithSuperscript('abc<sup>!</sup>')).toBe(true);
    });

    test('finds match with question mark', () => {
      expect(endsWithSuperscript('abc<sup>?</sup>')).toBe(true);
    });

    test('should not match when in middle of word', () => {
      expect(endsWithSuperscript('abc<sup>?</sup>def')).toBe(false);
    });

    test('shold not match normal marked up word', () => {
      expect(endsWithSuperscript('wo]rd')).toBe(false);
    });
  });

  describe('word without superscript', () => {
    test('strips superscript off end of word', () => {
      expect(wordWithoutSuperscript('abc<sup>!</sup>')).toBe('abc');
    });
  });

  test('it renders uncertain signs with superscripted exclamation point', () => {
    const htmlRenderer = createTabletRenderer(anor67units, anor67markups, {
      textFormat: 'html',
    });
    expect(htmlRenderer.lineReading(11)).toBe('[...] <em>a</em><sup>?</sup>-<em>g</em><em>i</em><em>₅</em>-<em>a</em> | <em>a</em>-<em>a</em>-<em>a</em><em>m</em>%');
  });
});

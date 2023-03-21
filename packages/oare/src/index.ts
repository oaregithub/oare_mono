import {
  EpigraphicUnit,
  CreateTabletRendererOptions,
  LocaleCode,
} from '@oare/types';
import TabletRenderer from './TabletRenderer';
import TabletHtmlRenderer from './TabletHtmlRenderer';
import TabletLineNumRenderer from './TabletLineNumRenderer';

export { default as DiscourseRenderer } from './DiscourseRenderer';
export { default as DiscourseHtmlRenderer } from './DiscourseHtmlRenderer';
export { default as TabletHtmlRenderer } from './TabletHtmlRenderer';
export { default as TabletLineNumRenderer } from './TabletLineNumRenderer';
export { default as TabletRenderer } from './TabletRenderer';

export {
  spellingHtmlReading,
  tokenizeExplicitSpelling,
} from './spellingTokenizer';

export {
  normalizeSign,
  normalizeFraction,
  normalizeNumber,
  indexOfFirstVowel,
  subscriptNumber,
} from './signNormalizer';

export {
  formatLineNumber,
  convertSideNumberToSide,
  convertSideToSideNumber,
} from './tabletUtils';

export { convertParsePropsToItemProps } from './parseTreeUtils';

export const AkkadianAlphabetLower = 'ăaāâbdeēêgḫhiīîyklmnpqrsṣštṭuūûúwz';
export const AkkadianAlphabetUpper = 'ĂAĀÂBDEĒÊGḪHIĪÎYKLMNPQRSṢŠTṬUŪÛÚWZ';
export const AkkadianLetterGroupsUpper: { [key: string]: string } = {
  A: 'ĂAĀÂ',
  B: 'B',
  D: 'D',
  E: 'EĒÊ',
  G: 'G',
  Ḫ: 'ḪH',
  I: 'IĪÎ',
  Y: 'Y',
  K: 'K',
  L: 'L',
  M: 'M',
  N: 'N',
  P: 'P',
  Q: 'Q',
  R: 'R',
  S: 'S',
  Ṣ: 'Ṣ',
  Š: 'Š',
  T: 'T',
  Ṭ: 'Ṭ',
  'U/W': 'UŪÛW',
  Z: 'Z',
};

export const AkkadianPhoneticGroups: { [key: string]: string[] } = {
  a: ['a', 'ā', 'á', 'à', 'â', 'A', 'Ā', 'Á', 'À', 'Â'],
  b: ['b', 'p', 'B', 'P'],
  d: ['d', 't', 'ṭ', 'D', 'T', 'Ṭ'],
  e: ['e', 'é', 'è', 'ē', 'ê', 'E', 'Ē', 'É', 'È', 'Ê'],
  g: ['k', 'q', 'g', 'K', 'G', 'Q'],
  ḫ: ['ḫ', 'h', 'Ḫ', 'H'],
  i: ['i', 'í', 'ì', 'ī', 'î', 'Í', 'Ì', 'Ī', 'Î', 'I'],
  k: ['g', 'k', 'q', 'G', 'K', 'Q'],
  l: ['l', 'L'],
  m: ['M', 'm'],
  n: ['N', 'n'],
  p: ['b', 'p', 'B', 'P'],
  q: ['g', 'k', 'q', 'G', 'K', 'Q'],
  r: ['R', 'r'],
  s: ['s', 'š', 'ṣ', 'z', 'S', 'Ṣ', 'Z', 'Š'],
  ṣ: ['s', 'ṣ', 'z', 'S', 'Ṣ', 'Z'],
  š: ['s', 'š', 'z', 'S', 'Z', 'Š'],
  t: ['d', 't', 'ṭ', 'D', 'T', 'Ṭ'],
  ṭ: ['d', 't', 'ṭ', 'D', 'T', 'Ṭ'],
  u: ['u', 'ù', 'ú', 'ū', 'û'],
  w: ['w', 'W'],
  z: ['s', 'ṣ', 'z', 'S', 'Z', 'Ṣ'],
};

/**
 * Factory function for creating a tablet renderer
 */
const createTabletRenderer = (
  epigraphicUnits: EpigraphicUnit[],
  locale: LocaleCode,
  {
    textFormat = 'regular',
    lineNumbers = false,
    showNullDiscourse = false,
    highlightDiscourses = [],
  }: CreateTabletRendererOptions = {}
): TabletRenderer => {
  let renderer = new TabletRenderer(epigraphicUnits, locale, textFormat);
  if (textFormat === 'html') {
    renderer = new TabletHtmlRenderer(renderer, {
      showNullDiscourse,
      highlightDiscourses,
    });
  }
  if (lineNumbers) {
    renderer = new TabletLineNumRenderer(renderer);
  }
  return renderer;
};

export { createTabletRenderer };

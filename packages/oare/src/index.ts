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

export { convertAppliedPropsToItemProps } from './parseTreeUtils';

export const AkkadianLetterGroupsUpper: { [key: string]: string[] } = {
  A: ['Ă', 'A', 'Ā', 'Â'],
  B: ['B'],
  D: ['D'],
  E: ['E', 'Ē', 'Ê'],
  G: ['G'],
  Ḫ: ['Ḫ', 'H'],
  I: ['I', 'Ī', 'Î'],
  Y: ['Y'],
  K: ['K'],
  L: ['L'],
  M: ['M'],
  N: ['N'],
  P: ['P'],
  Q: ['Q'],
  R: ['R'],
  S: ['S'],
  Ṣ: ['Ṣ'],
  Š: ['Š'],
  T: ['T'],
  Ṭ: ['Ṭ'],
  'U/W': ['U', 'Ū', 'Û', 'W'],
  Z: ['Z'],
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

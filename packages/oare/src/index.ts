import {
  EpigraphicUnit,
  MarkupUnit,
  CreateTabletRendererOptions,
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
  normalizeSign,
} from './spellingTokenizer';

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

/**
 * Factory function for creating a tablet renderer
 */
const createTabletRenderer = (
  epigraphicUnits: EpigraphicUnit[],
  markupUnits: MarkupUnit[],
  {
    textFormat = 'regular',
    lineNumbers = false,
    admin = false,
    highlightDiscourses = [],
  }: CreateTabletRendererOptions = {}
): TabletRenderer => {
  let renderer = new TabletRenderer(epigraphicUnits, markupUnits);
  if (textFormat === 'html') {
    renderer = new TabletHtmlRenderer(renderer, { admin, highlightDiscourses });
  }
  if (lineNumbers) {
    renderer = new TabletLineNumRenderer(renderer);
  }
  return renderer;
};

export { createTabletRenderer };

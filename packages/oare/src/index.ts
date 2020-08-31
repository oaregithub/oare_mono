import TabletRenderer from './TabletRenderer';
import TabletHtmlRenderer from './TabletHtmlRenderer';
import TabletLineNumRenderer from './TabletLineNumRenderer';

export { DiscourseUnit, DiscourseUnitType, default as DiscourseRenderer } from './DiscourseRenderer';
export { default as DiscourseHtmlRenderer } from './DiscourseHtmlRenderer';
export { default as TabletHtmlRenderer } from './TabletHtmlRenderer';
export { default as TabletLineNumRenderer } from './TabletLineNumRenderer';
export { EpigraphicUnitWithMarkup, default as TabletRenderer } from './TabletRenderer';

export type EpigraphicUnitType =
  | 'phonogram'
  | 'logogram'
  | 'number'
  | 'determinative';

export type EpigraphicUnitSide =
  | 'obv.'
  | 'lo.e.'
  | 'rev.'
  | 'u.e.'
  | 'le.e.'
  | 're.e.'
  | 0;

export interface EpigraphicUnit {
  uuid: string;
  side: EpigraphicUnitSide;
  column: number;
  line: number;
  charOnLine: number;
  charOnTablet: number;
  discourseUuid: string | null;
  reading: string | null;
  type: EpigraphicUnitType | null;
  value: null | string;
  markups?: MarkupUnit[];
}

export type MarkupType =
  | 'isCollatedReading'
  | 'alternateSign'
  | 'isEmendedReading'
  | 'erasure'
  | 'isUninterpreted'
  | 'isWrittenWithinPrevSign'
  | 'missing'
  | 'signEmended'
  | 'superfluous'
  | 'uncertain'
  | 'isWrittenAsLigature'
  | 'missingSigns'
  | 'damage'
  | 'partialDamage'
  | 'isWrittenOverErasure'
  | 'isWrittenBelowTheLine'
  | 'broken'
  | '...'
  | 'isSealImpression';

export interface MarkupUnit {
  referenceUuid: string;
  type: MarkupType;
  value: number | null;
  startChar: null | number;
  endChar: null | number;
}

export type TextFormatType = 'regular' | 'html';
export interface TextFormatOptions {
  format?: TextFormatType;
  markup?: boolean;
  lineNums?: boolean;
}

export interface CreateTabletRendererOptions {
  lineNumbers?: boolean;
  textFormat?: TextFormatType;
}

export const AkkadianAlphabetLower = 'ăaāâbdeēêgḫhiīîyklmnpqrsṣštṭuūûwz';
export const AkkadianAlphabetUpper = 'ĂAĀÂBDEĒÊGḪHIĪÎYKLMNPQRSṢŠTṬUŪÛWZ';
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
// export const AkkadianLetterGroupsLower = AkkadianLetterGroupsUpper.map(
//   (group) => group.toLowerCase()
// );

/**
 * Factory function for creating a tablet renderer
 */
const createTabletRenderer = (
  epigraphicUnits: EpigraphicUnit[],
  markupUnits: MarkupUnit[],
  {
    textFormat = 'regular',
    lineNumbers = false,
  }: CreateTabletRendererOptions = {},
): TabletRenderer => {
  let renderer = new TabletRenderer(epigraphicUnits, markupUnits);
  if (textFormat === 'html') {
    renderer = new TabletHtmlRenderer(renderer);
  }
  if (lineNumbers) {
    renderer = new TabletLineNumRenderer(renderer);
  }
  return renderer;
};

export { createTabletRenderer };

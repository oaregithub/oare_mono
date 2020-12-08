import TabletRenderer from './TabletRenderer';
import TabletHtmlRenderer from './TabletHtmlRenderer';
import TabletLineNumRenderer from './TabletLineNumRenderer';

export {
  DiscourseUnit,
  DiscourseUnitType,
  default as DiscourseRenderer,
} from './DiscourseRenderer';
export { default as DiscourseHtmlRenderer } from './DiscourseHtmlRenderer';
export { default as TabletHtmlRenderer } from './TabletHtmlRenderer';
export { default as TabletLineNumRenderer } from './TabletLineNumRenderer';
export {
  EpigraphicUnitWithMarkup,
  default as TabletRenderer,
} from './TabletRenderer';

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
  admin?: boolean;
}

type TokenType = 'SYLLABLE' | 'SUPERSCRIPT' | 'SEPARATOR';
type State = null | 'READ_SUPERSCRIPT' | 'READ_SYLLABLE';

type Token = {
  classifier: TokenType;
  reading: string;
};

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
  }: CreateTabletRendererOptions = {},
): TabletRenderer => {
  let renderer = new TabletRenderer(epigraphicUnits, markupUnits);
  if (textFormat === 'html') {
    renderer = new TabletHtmlRenderer(renderer, admin);
  }
  if (lineNumbers) {
    renderer = new TabletLineNumRenderer(renderer);
  }
  return renderer;
};

const tokenizeExplicitSpelling = (spelling: string): Token[] => {
  let state: State = null;
  let reading = '';
  const tokens: Token[] = [];
  const eof = String.fromCharCode(-1);

  spelling
    .concat(eof)
    .split('')
    .forEach((char) => {
      switch (state) {
        case null:
          if (char === '(') {
            state = 'READ_SUPERSCRIPT';
          } else {
            state = 'READ_SYLLABLE';
            reading += char;
          }
          break;
        case 'READ_SUPERSCRIPT':
          if (char === ')' || char === eof) {
            tokens.push({
              classifier: 'SUPERSCRIPT',
              reading,
            });
            reading = '';
            state = null;
          } else {
            reading += char;
          }
          break;
        case 'READ_SYLLABLE':
          if (char === '.' || char === '-') {
            tokens.push({
              classifier: 'SYLLABLE',
              reading,
            });
            tokens.push({
              classifier: 'SEPARATOR',
              reading: char,
            });
            reading = '';
            state = null;
          } else if (char === '(' || char === eof) {
            tokens.push({
              classifier: 'SYLLABLE',
              reading,
            });
            reading = '';
            state = 'READ_SUPERSCRIPT';
          } else {
            reading += char;
          }
          break;
        default:
          break;
      }
    });
  return tokens;
};

const spellingHtmlReading = (spelling: string): string => {
  return spelling
    .split(' ')
    .map((s) =>
      tokenizeExplicitSpelling(s)
        .map((token) => {
          if (token.classifier === 'SUPERSCRIPT') {
            return `<sup>${token.reading}</sup>`;
          }
          if (token.classifier === 'SYLLABLE') {
            if (token.reading === token.reading.toLowerCase()) {
              return `<em>${token.reading}</em>`;
            }
            return token.reading;
          }
          return token.reading;
        })
        .join(''),
    )
    .join(' ');
};

export { createTabletRenderer, spellingHtmlReading, tokenizeExplicitSpelling };

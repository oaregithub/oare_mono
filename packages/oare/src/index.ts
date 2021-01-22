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

export interface TabletHtmlOptions {
  admin?: boolean;
  highlightDiscourses?: string[];
}

export interface CreateTabletRendererOptions extends TabletHtmlOptions {
  lineNumbers?: boolean;
  textFormat?: TextFormatType;
}

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
  }: CreateTabletRendererOptions = {},
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

const isAlpha = (char: string): boolean => {
  // Convert letter with diacritics to normal letter. See https://stackoverflow.com/a/37511463/4231848
  const normalizedChar = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return !!normalizedChar.match(/[a-z₀₁₂₃₄₅₆₇₈₉]/i);
};

const isDigit = (char: string): boolean => !!char.match(/\d/);

const isSeparator = (char: string): boolean => ['.', '-', ' '].includes(char);

type TokenType = 'SYLLABLE' | 'SUPERSCRIPT' | 'SEPARATOR' | 'NUMBER' | 'ERROR';
type State = null | 'READ_SUPERSCRIPT' | 'READ_SYLLABLE' | 'READ_NUMBER';

export type Token = {
  classifier: TokenType;
  reading: string;
};

const tokenizeExplicitSpelling = (spelling: string): Token[] => {
  let state: State = null;
  let reading = '';
  const tokens: Token[] = [];
  const eof = String.fromCharCode(-1);

  spelling
    .concat(eof)
    .split('')
    .forEach((char, i) => {
      const isLastCharacter = () => i === spelling.length - 1;

      switch (state) {
        case null:
          if (char === '(') {
            state = 'READ_SUPERSCRIPT';
          } else if (isAlpha(char)) {
            state = 'READ_SYLLABLE';
            reading += char;
          } else if (isDigit(char)) {
            state = 'READ_NUMBER';
            reading += char;
          } else if (char !== eof) {
            tokens.push({
              classifier: 'ERROR',
              reading: char,
            });
          }
          break;
        case 'READ_SUPERSCRIPT':
          if (char === ')') {
            tokens.push({
              classifier: 'SUPERSCRIPT',
              reading,
            });
            reading = '';
            state = null;
          } else if (isAlpha(char) || isDigit(char)) {
            reading += char;
          } else {
            tokens.push({
              classifier: 'SUPERSCRIPT',
              reading,
            });
            tokens.push({
              classifier: 'ERROR',
              reading: char,
            });
            reading = '';
          }
          break;
        case 'READ_SYLLABLE':
          if (
            isSeparator(char) &&
            !isLastCharacter() &&
            isAlpha(spelling[i + 1])
          ) {
            tokens.push({
              classifier: 'SYLLABLE',
              reading,
            });
            tokens.push({
              classifier: 'SEPARATOR',
              reading: char,
            });
            reading = '';
          } else if (char === '(' || char === eof) {
            tokens.push({
              classifier: 'SYLLABLE',
              reading,
            });
            reading = '';
            state = 'READ_SUPERSCRIPT';
          } else if (isDigit(char)) {
            // 8320 is the unicode for subscripted 0
            reading += String.fromCharCode(8320 + Number(char));
          } else if (isAlpha(char)) {
            reading += char;
          } else {
            tokens.push({
              classifier: 'SYLLABLE',
              reading,
            });
            tokens.push({
              classifier: 'ERROR',
              reading: char,
            });
            reading = '';
          }
          break;
        case 'READ_NUMBER':
          if (isDigit(char)) {
            reading += char;
          } else if (char === '.') {
            if (i < spelling.length - 1 && isAlpha(spelling[i + 1])) {
              tokens.push({
                classifier: 'NUMBER',
                reading,
              });
              tokens.push({
                classifier: 'SEPARATOR',
                reading: char,
              });
              state = 'READ_SYLLABLE';
              reading = '';
            } else if (
              !reading.includes('.') &&
              i < spelling.length - 1 &&
              isDigit(spelling[i + 1])
            ) {
              reading += char;
            } else {
              tokens.push({
                classifier: 'NUMBER',
                reading,
              });
              tokens.push({
                classifier: 'ERROR',
                reading: char,
              });
              reading = '';
            }
          } else if (char === '+' || char === ' ') {
            tokens.push({
              classifier: 'NUMBER',
              reading,
            });
            tokens.push({
              classifier: 'SEPARATOR',
              reading: char,
            });
            reading = '';
            if (char === ' ') {
              state = null;
            }
          } else if (char === eof) {
            tokens.push({
              classifier: 'NUMBER',
              reading,
            });
            reading = '';
            state = null;
          } else {
            tokens.push({
              classifier: 'NUMBER',
              reading,
            });
            tokens.push({
              classifier: 'ERROR',
              reading: char,
            });
            reading = '';
          }
          break;
        default:
          break;
      }
    });
  return tokens;
};

const spellingHtmlReading = (spelling: string): string => {
  const tokenizedSpelling = tokenizeExplicitSpelling(spelling)
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
      if (token.classifier === 'ERROR') {
        return `<mark style="background-color: #ffb3b3">${
          token.reading === String.fromCharCode(-1) ? '&nbsp;' : token.reading
        }</mark>`;
      }
      return token.reading;
    })
    .join('');
  return tokenizedSpelling;
};

export { createTabletRenderer, spellingHtmlReading, tokenizeExplicitSpelling };

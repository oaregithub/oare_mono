import { DiscourseUnit, TextDiscourseRow } from './textDiscourse';
import { TextDraft, RowTypes } from './drafts';
import { Collection } from './collection';
import { ParseTreeProperty } from './dictionary';
import { SignCodeWithDiscourseUuid } from './sign_reading';

export interface Text {
  id: number;
  uuid: string;
  type: string;
  name: string;
  excavationPrefix: string | null;
  excavationNumber: string | null;
  museumPrefix: string | null;
  museumNumber: string | null;
  publicationPrefix: string | null;
  publicationNumber: string | null;
}

export interface EpigraphyResponse {
  canWrite: boolean;
  text: Text | null;
  collection: Collection;
  cdliNum: string | null;
  units: EpigraphicUnit[];
  color: string;
  colorMeaning: string;
  discourseUnits: DiscourseUnit[];
  draft?: TextDraft;
}

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
  | 'r.e.'
  | 'mirror text'
  | 'legend'
  | 'suppl. tablet'
  | 'vs.!'
  | 'near hilt'
  | 'obv. col. i'
  | 'obv. col. ii'
  | 'le.e. col. i'
  | 'le.e. col. ii'
  | 'le.e. col. iii'
  | 'col. i'
  | 'col. ii'
  | 'col. iii'
  | 'col. iv'
  | 'col. v'
  | 'col. vi'
  | "col. i'"
  | "col. ii'"
  | "col. iii'"
  | "col. iv'"
  | 0;

export type EpigraphyType =
  | 'column'
  | 'epigraphicUnit'
  | 'line'
  | 'number'
  | 'region'
  | 'section'
  | 'separator'
  | 'sign'
  | 'stamp'
  | 'undeterminedLines'
  | 'undeterminedSigns';

export interface EpigraphicUnit {
  uuid: string;
  side: EpigraphicUnitSide;
  column: number;
  line: number;
  charOnLine: number;
  charOnTablet: number;
  objOnTablet: number;
  discourseUuid: string | null;
  reading: string | null;
  epigType: EpigraphyType;
  type: EpigraphicUnitType | null;
  value: null | string;
  markups: MarkupUnit[];
  readingUuid: string;
  signUuid: string;
}

export type MarkupType =
  | 'isCollatedReading'
  | 'alternateSign'
  | 'isEmendedReading'
  | 'erasure'
  | 'isUninterpreted'
  | 'isWrittenWithinPrevSign'
  | 'omitted'
  | 'originalSign'
  | 'superfluous'
  | 'uncertain'
  | 'isWrittenAsLigature'
  | 'undeterminedSigns'
  | 'undeterminedLines'
  | 'damage'
  | 'partialDamage'
  | 'isWrittenOverErasure'
  | 'isWrittenBelowTheLine'
  | 'broken'
  | 'isSealImpression'
  | 'uninscribed'
  | 'ruling'
  | 'isStampSealImpression';

export interface MarkupUnit {
  referenceUuid: string;
  type: MarkupType;
  value: number | null;
  startChar: null | number;
  endChar: null | number;
}

export type TextFormatType = 'regular' | 'html';

export interface TabletHtmlOptions {
  showNullDiscourse?: boolean;
  highlightDiscourses?: string[];
}

export interface CreateTabletRendererOptions extends TabletHtmlOptions {
  lineNumbers?: boolean;
  textFormat?: TextFormatType;
}

export interface EpigraphicUnitWithMarkup
  extends Pick<EpigraphicUnit, 'readingUuid' | 'signUuid'> {
  type: EpigraphicUnitType | null;
  reading: string;
  discourseUuid: string | null;
}

export interface EpigraphicSign
  extends Pick<EpigraphicUnit, 'signUuid' | 'readingUuid' | 'reading'> {}

export interface EpigraphicWord
  extends Pick<EpigraphicUnit, 'discourseUuid' | 'reading'> {
  signs: EpigraphicSign[];
}

export interface TranslitOption {
  color: string;
  colorMeaning: string;
}

export interface UpdateTranslitStatusPayload {
  textUuid: string;
  color: string;
}

export type SideOption = 'obv.' | 'lo.e.' | 'rev.' | 'u.e.' | 'le.e.' | 'r.e.';

export interface AddTextInfo {
  textName: string | null;
  cdliNum: string | null;
  excavationPrefix: string | null;
  excavationNumber: string | null;
  museumPrefix: string | null;
  museumNumber: string | null;
  publicationPrefix: string | null;
  publicationNumber: string | null;
  properties: ParseTreeProperty[];
}

export interface AddTextEditorContent {
  sides: SideContent[];
}

export interface SideContent {
  uuid: string;
  type: SideOption;
  number: number;
  columns: ColumnContent[];
}

export interface ColumnContent {
  uuid: string;
  rows: RowContent[];
}

export interface RowContent {
  uuid: string;
  type: RowTypes;
  lines: number[];
  value?: number;
  text?: string;
  signs?: SignCodeWithDiscourseUuid[];
  words?: EditorWord[];
}

export interface TextPhoto {
  uuid: string;
  url?: string;
  side?: string | number;
  view?: string;
}

export interface TextEpigraphyRowPartial {
  uuid: string;
  type: EpigraphyType;
  textUuid: string;
  treeUuid: string;
  parentUuid?: string;
  objectOnTablet?: number;
  side?: number;
  column?: number;
  line?: number;
  charOnLine?: number;
  charOnTablet?: number;
  signUuid?: string;
  sign?: string;
  readingUuid?: string;
  reading?: string;
  discourseUuid?: string;
}

export interface TextEpigraphyRow {
  uuid: string;
  type: EpigraphyType;
  textUuid: string;
  treeUuid: string;
  parentUuid: string | null;
  objectOnTablet: number | null;
  side: number | null;
  column: number | null;
  line: number | null;
  charOnLine: number | null;
  charOnTablet: number | null;
  signUuid: string | null;
  sign: string | null;
  readingUuid: string | null;
  reading: string | null;
  discourseUuid: string | null;
}

export interface TextMarkupRowPartial {
  uuid: string;
  referenceUuid: string;
  type: MarkupType;
  numValue?: number;
  altReadingUuid?: string;
  altReading?: string;
  startChar?: number;
  endChar?: number;
  objectUuid?: string;
}

export interface TextMarkupRow {
  uuid: string;
  referenceUuid: string;
  type: MarkupType;
  numValue: number | null;
  altReadingUuid: string | null;
  altReading: string | null;
  startChar: number | null;
  endChar: number | null;
  objectUuid: string | null;
}

export interface TextRow {
  uuid: string;
  type: string;
  language: string | null;
  cdliNum: string | null;
  translitStatus: string;
  name: string | null;
  excavationPrefix: string | null;
  excavationNumber: string | null;
  museumPrefix: string | null;
  museumNumber: string | null;
  publicationPrefic: string | null;
  publicationNumber: string | null;
  objectType: string | null;
  source: string | null;
  genre: string | null;
  subgenre: string | null;
}

export interface SignInfo {
  referenceUuid: string;
  type: EpigraphicUnitType | null;
  value: string | null;
}

export interface CreateTextTables {
  epigraphies: TextEpigraphyRow[];
  markups: TextMarkupRow[];
  discourses: TextDiscourseRow[];
  text: TextRow;
  signInfo: SignInfo[];
}

export interface EditorWord {
  spelling: string;
  discourseUuid: string;
}

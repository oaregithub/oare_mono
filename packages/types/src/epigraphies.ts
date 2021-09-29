import { DiscourseUnit } from './textDiscourse';
import { TextDraft, RowTypes } from './drafts';
import { Collection } from './collection';
import { ParseTreeProperty } from './dictionary';

export interface EpigraphyResponse {
  canWrite: boolean;
  textName: string;
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

type EpigraphyType =
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
}

export interface TextPhoto {
  uuid: string;
  url?: string;
  side?: string | number;
  view?: string;
}

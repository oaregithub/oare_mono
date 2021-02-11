import { DiscourseUnit } from './textDiscourse';
import { TextDraft } from './drafts';

export interface TextInfoResponse {
  name: string;
}

export interface EpigraphyResponse {
  canWrite: boolean;
  textName: string;
  collection: {
    uuid: string;
    name: string;
  };
  cdliNum: string | null;
  units: EpigraphicUnit[];
  color: string;
  colorMeaning: string;
  markups: MarkupUnit[];
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

export interface EpigraphicUnitWithMarkup {
  type: EpigraphicUnitType;
  reading: string;
  discourseUuid: string | null;
}

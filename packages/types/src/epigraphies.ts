import { DiscourseUnit, TextDiscourseRow } from './textDiscourse';
import { TextDraft, RowTypes } from './drafts';
import { Collection } from './collection';
import { ParseTreeProperty, InsertItemPropertyRow } from './dictionary';
import { SignCodeWithDiscourseUuid } from './sign_reading';
import { TreeRow } from './tree';

export interface Text {
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
  text: Text;
  collection: Collection;
  cdliNum: string | null;
  units: EpigraphicUnit[];
  color: string;
  colorMeaning: string;
  discourseUnits: DiscourseUnit[];
  draft?: TextDraft;
  hasEpigraphy: boolean;
  zoteroData: ZoteroData[];
}
export interface ZoteroData {
  citation: string;
  link: string | null;
  pageLink: string | null;
  plateLink: string | null;
}

export type EpigraphicUnitType =
  | 'phonogram'
  | 'logogram'
  | 'number'
  | 'determinative'
  | 'punctuation';

export type EpigraphicUnitSide =
  | 'obv.'
  | 'lo.e.'
  | 'rev.'
  | 'u.e.'
  | 'le.e.'
  | 'r.e.'
  | 'mirror text'
  | 'legend'
  | 'suppl. tablet';

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
  side: EpigraphicUnitSide | null;
  column: number | null;
  line: number | null;
  charOnLine: number | null;
  charOnTablet: number | null;
  objOnTablet: number;
  discourseUuid: string | null;
  reading: string | null;
  epigType: EpigraphyType;
  type: EpigraphicUnitType | null;
  value: null | string;
  markups: MarkupUnit[];
  readingUuid: string | null;
  signUuid: string | null;
  spellingUuid: string | null;
}

export type MarkupType =
  | 'isCollatedReading'
  | 'alternateSign'
  | 'isEmendedReading'
  | 'erasure'
  | 'isUninterpreted'
  | 'omitted'
  | 'originalSign'
  | 'superfluous'
  | 'uncertain'
  | 'undeterminedSigns'
  | 'undeterminedLines'
  | 'damage'
  | 'partialDamage'
  | 'isWrittenOverErasure'
  | 'isWrittenBelowTheLine'
  | 'isWrittenAboveTheLine'
  | 'broken'
  | 'isSealImpression'
  | 'uninscribed'
  | 'ruling'
  | 'isStampSealImpression'
  | 'phoneticComplement';

export interface MarkupUnit {
  referenceUuid: string;
  type: MarkupType;
  value: number | null;
  startChar: number | null;
  endChar: number | null;
  altReading: string | null;
  altReadingUuid: string | null;
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
  extends Pick<
    EpigraphicUnit,
    | 'uuid'
    | 'epigType'
    | 'readingUuid'
    | 'signUuid'
    | 'markups'
    | 'spellingUuid'
  > {
  type: EpigraphicUnitType | null;
  reading: string;
  discourseUuid: string | null;
}

export interface EpigraphicSign
  extends Pick<
    EpigraphicUnit,
    | 'uuid'
    | 'epigType'
    | 'type'
    | 'signUuid'
    | 'readingUuid'
    | 'reading'
    | 'markups'
  > {
  separator: string;
}

export interface EpigraphicWord
  extends Pick<EpigraphicUnit, 'discourseUuid' | 'reading'> {
  uuids: string[];
  isDivider: boolean;
  signs: EpigraphicSign[];
  isContraction: boolean;
}

export interface TranslitOption {
  color: string;
  colorMeaning: string;
}

export interface UpdateTranslitStatusPayload {
  textUuid: string;
  color: string;
}

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
  type: EpigraphicUnitSide;
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
  reading?: string;
  hasErrors: boolean;
}

export interface TextPhoto {
  uuid: string;
  url?: string;
  side?: string | number;
  view?: string;
  upload?: File;
}

export interface TextPhotoWithDetails extends TextPhoto {
  name: string;
  properties: ParseTreeProperty[];
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
  displayName: string | null;
  excavationPrefix: string | null;
  excavationNumber: string | null;
  museumPrefix: string | null;
  museumNumber: string | null;
  publicationPrefix: string | null;
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

export interface ResourceRow {
  uuid: string;
  sourceUuid: string | null;
  type: string;
  container: string;
  format: string | null;
  link: string;
}

export interface LinkRow {
  uuid: string;
  referenceUuid: string;
  objUuid: string;
}

export interface HierarchyRow {
  uuid: string;
  parentUuid: string | null;
  type: string;
  role: string | null;
  objectUuid: string;
  objectParentUuid: string | null;
  published: number;
}

export interface CreateTextTables {
  epigraphies: TextEpigraphyRow[];
  markups: TextMarkupRow[];
  discourses: TextDiscourseRow[];
  text: TextRow;
  itemProperties: InsertItemPropertyRow[];
  signInfo: SignInfo[];
  resources: ResourceRow[];
  links: LinkRow[];
  hierarchy: HierarchyRow;
  trees: TreeRow[];
}

export interface EditorWord {
  spelling: string;
  discourseUuid: string | null;
}

export interface EditorMarkupPiece {
  type: MarkupType;
  startChar?: number;
  endChar?: number;
  altReading?: string;
  isDeterminative?: boolean;
  numValue?: number;
}

export interface EditorMarkup {
  text: string;
  markup: EditorMarkupPiece[];
  post: string;
  wordIndex: number;
}

export interface EditorMarkupError {
  error: string;
  text?: string;
}

export interface CreateTextsPayload {
  tables: CreateTextTables;
}

export interface EpigraphyLabelLink {
  label: string;
  link: string;
  side: string | number | null;
  view: string | null;
}

export interface ImageResource {
  label: string;
  link: string;
  uuid: string;
}

export interface ImageResourcePropertyDetails {
  side: string | null;
  view: string | null;
}

export interface QuarantineText {
  text: Text;
  hasEpigraphy: boolean;
  timestamp: string;
}

export interface DiscourseSpelling {
  discourseUuid: string;
  spellingUuid: string;
}

export type EditTextAction =
  | 'addSide'
  | 'addColumn'
  | 'addRegion'
  | 'addLine'
  | 'addUndeterminedLines'
  | 'addWord'
  | 'addSign'
  | 'addUndeterminedSigns'
  | 'addDivider'
  | 'editSide'
  | 'editColumn'
  | 'editRegion'
  | 'editUndeterminedLines'
  | 'editSign'
  | 'editUndeterminedSigns'
  | 'splitLine'
  | 'splitWord'
  | 'splitSign'
  | 'mergeLine'
  | 'mergeWord'
  | 'mergeSign'
  | 'removeSide'
  | 'removeColumn'
  | 'removeRegion'
  | 'removeLine'
  | 'removeUndeterminedLines'
  | 'removeWord'
  | 'removeSign'
  | 'removeUndeterminedSigns'
  | 'removeDivider'
  | 'cleanLine';

export interface EditTextPayloadBase {
  type: EditTextAction;
  textUuid: string;
}

export interface AddSidePayload extends EditTextPayloadBase {
  type: 'addSide';
  side: EpigraphicUnitSide;
}

export interface AddColumnPayload extends EditTextPayloadBase {
  type: 'addColumn';
  side: EpigraphicUnitSide;
  column: number;
}

export interface AddRegionPayload extends EditTextPayloadBase {
  type: 'addRegion';
  side: EpigraphicUnitSide;
  column: number;
  regionType: MarkupType;
  regionValue?: number;
  regionLabel?: string;
  previousObjectOnTablet?: number;
}

export interface AddLinePayload extends EditTextPayloadBase {
  type: 'addLine';
  side: EpigraphicUnitSide;
  column: number;
  row: RowContent;
  previousObjectOnTablet?: number;
  discourseSpellings: DiscourseSpelling[];
}

export interface EditSidePayload extends EditTextPayloadBase {
  type: 'editSide';
  originalSide: EpigraphicUnitSide;
  newSide: EpigraphicUnitSide;
}

export interface EditColumnPayload extends EditTextPayloadBase {
  type: 'editColumn';
  side: EpigraphicUnitSide;
  column: number;
  direction: 'left' | 'right';
}

export interface MergeLinePayload extends EditTextPayloadBase {
  type: 'mergeLine';
  firstLine: number;
  secondLine: number;
}

export interface CleanLinesPayload extends EditTextPayloadBase {
  type: 'cleanLine';
}

export interface RemoveSidePayload extends EditTextPayloadBase {
  type: 'removeSide';
  side: EpigraphicUnitSide;
}

export interface RemoveColumnPayload extends EditTextPayloadBase {
  type: 'removeColumn';
  side: EpigraphicUnitSide;
  column: number;
}

export interface RemoveRegionPayload extends EditTextPayloadBase {
  type: 'removeRegion';
  uuid: string;
}

export interface RemoveLinePayload extends EditTextPayloadBase {
  type: 'removeLine';
  line: number;
}

export interface RemoveUndeterminedLinesPayload extends EditTextPayloadBase {
  type: 'removeUndeterminedLines';
  uuid: string;
}

export interface RemoveWordPayload extends EditTextPayloadBase {
  type: 'removeWord';
  discourseUuid: string;
  line: number;
}

export interface RemoveSignPayload extends EditTextPayloadBase {
  type: 'removeSign' | 'removeUndeterminedSigns';
  uuid: string;
  spellingUuid: string | null;
  spelling: string;
  line: number;
}

export interface RemoveDividerPayload extends EditTextPayloadBase {
  type: 'removeDivider';
  uuid: string;
  line: number;
}

export type EditTextPayload =
  | AddSidePayload
  | AddColumnPayload
  | AddRegionPayload
  | AddLinePayload
  | EditSidePayload
  | EditColumnPayload
  | MergeLinePayload
  | CleanLinesPayload
  | RemoveSidePayload
  | RemoveColumnPayload
  | RemoveRegionPayload
  | RemoveLinePayload
  | RemoveUndeterminedLinesPayload
  | RemoveWordPayload
  | RemoveSignPayload
  | RemoveDividerPayload;

import {
  TextDiscourseUnit,
  TextDiscourseRow,
  DiscourseUnitType,
} from './text_discourse';
import { CollectionRow } from './collection';
import {
  SignCodeWithDiscourseUuid,
  SignReadingRow,
  SignReadingType,
  SignRow,
} from './sign_reading';
import { TreeRow } from './tree';
import { AppliedProperty, ItemProperty, ItemPropertyRow } from './properties';
import { TextTransliterationStatus, TextRow, Text } from './text';
import { Citation } from './bibliography';
import { Image, ResourceRow, LinkRow } from './resource';
import { MarkupType, TextMarkupRow } from './text_markup';
import { HierarchyRow } from './hierarchy';
import { DictionarySpellingRow } from './dictionary_spelling';
import { DictionaryFormRow } from './dictionary_form';
import { DictionaryWordRow } from './dictionary_word';

// FIXME

export interface TextEpigraphyRow {
  uuid: string;
  type: EpigraphyType;
  textUuid: string;
  treeUuid: string;
  parentUuid: string | null;
  objectOnTablet: number;
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

export interface EpigraphicUnit extends TextEpigraphyRow {
  sideReading: EpigraphicUnitSide | null;
  properties: ItemProperty[];
  signRow: SignRow | null;
  signReadingRow: SignReadingRow | null;
  markup: TextMarkupRow[];
  discourse: TextDiscourseRow | null;
  spelling: DictionarySpellingRow | null;
  form: DictionaryFormRow | null;
  word: DictionaryWordRow | null;
}

export interface Epigraphy {
  text: Text;
  collection: CollectionRow;
  transliteration: TextTransliterationStatus;
  units: EpigraphicUnit[];
  discourseUnits: TextDiscourseUnit[];
  citations: Citation[];
  sourceText: string | null;
  images: Image[];
  canEdit: boolean;
}

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
  | 'obv. ii';

export type EpigraphyType =
  | 'column'
  | 'epigraphicUnit'
  | 'line'
  | 'number'
  | 'region'
  | 'section'
  | 'separator'
  | 'sign'
  | 'undeterminedLines'
  | 'undeterminedSigns';

// BEGIN ADD TEXTS

export type RowTypes =
  | 'Line'
  | 'Broken Line(s)'
  | 'Ruling(s)'
  | 'Seal Impression'
  | 'Broken Area'
  | 'Uninscribed Line(s)';

export interface AddTextInfo {
  textName: string | null;
  cdliNum: string | null;
  excavationPrefix: string | null;
  excavationNumber: string | null;
  museumPrefix: string | null;
  museumNumber: string | null;
  publicationPrefix: string | null;
  publicationNumber: string | null;
  properties: AppliedProperty[];
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
  regionDiscourseUuid?: string;
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
  properties: AppliedProperty[];
}

export interface CreateTextTables {
  epigraphies: TextEpigraphyRow[];
  markups: TextMarkupRow[];
  discourses: TextDiscourseRow[];
  text: TextRow;
  itemProperties: ItemPropertyRow[];
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

export interface EditorDiscourseWord extends EditorWord {
  type: DiscourseUnitType;
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

export interface SignInfo {
  referenceUuid: string;
  type: SignReadingType | null;
  value: string | null;
}

// END ADD TEXTS

// EDITS SHOULD BE GOOD FOR NOW DON'T TOUCH

export type EditTextAction =
  | 'addSide'
  | 'addColumn'
  | 'addRegionBroken'
  | 'addRegionRuling'
  | 'addRegionSealImpression'
  | 'addRegionUninscribed'
  | 'addLine'
  | 'addUndeterminedLines'
  | 'addWord'
  | 'addSign'
  | 'addUndeterminedSigns'
  | 'addDivider'
  | 'editSide'
  | 'editColumn'
  | 'editRegionBroken'
  | 'editRegionRuling'
  | 'editRegionSealImpression'
  | 'editRegionUninscribed'
  | 'editUndeterminedLines'
  | 'editSign'
  | 'editUndeterminedSigns'
  | 'editDivider'
  | 'splitLine'
  | 'splitWord'
  | 'mergeLine'
  | 'mergeWord'
  | 'reorderSign'
  | 'cleanLine'
  | 'removeSide'
  | 'removeColumn'
  | 'removeRegionBroken'
  | 'removeRegionRuling'
  | 'removeRegionSealImpression'
  | 'removeRegionUninscribed'
  | 'removeLine'
  | 'removeUndeterminedLines'
  | 'removeWord'
  | 'removeSign'
  | 'removeUndeterminedSigns'
  | 'removeDivider';

export interface DiscourseSpelling {
  discourseUuid: string;
  spellingUuid: string;
  transcription: string;
}

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
  type:
    | 'addRegionBroken'
    | 'addRegionRuling'
    | 'addRegionSealImpression'
    | 'addRegionUninscribed';
  side: EpigraphicUnitSide;
  column: number;
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

export interface AddUndeterminedLinesPayload extends EditTextPayloadBase {
  type: 'addUndeterminedLines';
  side: EpigraphicUnitSide;
  column: number;
  number: number;
  previousObjectOnTablet?: number;
}

export interface AddWordEditPayload extends EditTextPayloadBase {
  type: 'addWord';
  side: EpigraphicUnitSide;
  column: number;
  line: number;
  previousDiscourseUuid?: string;
  row: RowContent;
  spellingUuid: string | null;
  transcription: string | null;
}

export interface AddSignPayload extends EditTextPayloadBase {
  type: 'addSign';
  sign: SignCodeWithDiscourseUuid;
  side: EpigraphicUnitSide;
  column: number;
  line: number;
  signUuidBefore: string | null;
  spellingUuid: string | null;
  spelling: string;
  transcription: string | null;
  discourseUuid: string | null;
}

export interface AddUndeterminedSignsPayload extends EditTextPayloadBase {
  type: 'addUndeterminedSigns';
  side: EpigraphicUnitSide;
  column: number;
  line: number;
  number: number;
  signUuidBefore: string | null;
  spelling: string;
  discourseUuid: string | null;
}

export interface AddDividerPayload extends EditTextPayloadBase {
  type: 'addDivider';
  side: EpigraphicUnitSide;
  column: number;
  line: number;
  signUuidBefore: string | null;
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

export interface EditRegionPayload extends EditTextPayloadBase {
  type:
    | 'editRegionBroken'
    | 'editRegionRuling'
    | 'editRegionSealImpression'
    | 'editRegionUninscribed';
  uuid: string;
  regionType: MarkupType;
  regionValue?: number;
  regionLabel?: string;
}

export interface EditUndeterminedLinesPayload extends EditTextPayloadBase {
  type: 'editUndeterminedLines';
  uuid: string;
  number?: number;
  convertToBrokenArea: boolean;
}

export interface EditSignPayload extends EditTextPayloadBase {
  type: 'editSign';
  uuid: string;
  spelling: string;
  spellingUuid: string | null;
  transcription: string | null;
  discourseUuid: string | null;
  markup: TextMarkupRow[];
  sign: SignCodeWithDiscourseUuid;
}

export interface EditUndeterminedSignsPayload extends EditTextPayloadBase {
  type: 'editUndeterminedSigns';
  uuid: string;
  number: number;
  markup: TextMarkupRow[];
}

export interface EditDividerPayload extends EditTextPayloadBase {
  type: 'editDivider';
  uuid: string;
  markup: TextMarkupRow[];
}

export interface SplitLinePayload extends EditTextPayloadBase {
  type: 'splitLine';
  side: EpigraphicUnitSide;
  column: number;
  line: number;
  previousUuid: string;
}

export interface SplitWordPayload extends EditTextPayloadBase {
  type: 'splitWord';
  previousUuid: string;
  discourseUuid: string;
  firstSpelling: string;
  firstSpellingUuid: string | null;
  firstTranscription: string | null;
  secondSpelling: string;
  secondSpellingUuid: string | null;
  secondTranscription: string | null;
  propertySelections: number[];
}

export interface MergeLinePayload extends EditTextPayloadBase {
  type: 'mergeLine';
  firstLine: number;
  secondLine: number;
}

export interface MergeWordPayload extends EditTextPayloadBase {
  type: 'mergeWord';
  discourseUuids: string[];
  spelling: string;
  spellingUuid: string | null;
  transcription: string | null;
}

export interface ReorderSignPayload extends EditTextPayloadBase {
  type: 'reorderSign';
  spelling: string;
  spellingUuid: string | null;
  transcription: string | null;
  signUuids: string[];
  discourseUuid: string | null;
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
  type:
    | 'removeRegionBroken'
    | 'removeRegionRuling'
    | 'removeRegionSealImpression'
    | 'removeRegionUninscribed';
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
  transcription: string | null;
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
  | AddUndeterminedLinesPayload
  | AddWordEditPayload
  | AddSignPayload
  | AddUndeterminedSignsPayload
  | AddDividerPayload
  | EditSidePayload
  | EditColumnPayload
  | EditRegionPayload
  | EditUndeterminedLinesPayload
  | EditSignPayload
  | EditUndeterminedSignsPayload
  | EditDividerPayload
  | SplitLinePayload
  | SplitWordPayload
  | MergeLinePayload
  | MergeWordPayload
  | ReorderSignPayload
  | CleanLinesPayload
  | RemoveSidePayload
  | RemoveColumnPayload
  | RemoveRegionPayload
  | RemoveLinePayload
  | RemoveUndeterminedLinesPayload
  | RemoveWordPayload
  | RemoveSignPayload
  | RemoveDividerPayload;

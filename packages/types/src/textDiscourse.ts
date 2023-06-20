import { SearchNullDiscourseResultRow } from './search';
import { Note } from './notes';
import { AppliedProperty, ItemProperty } from './properties';
import { TextEpigraphyRow } from './epigraphies';
import { FieldRow } from './field';

// FIXME

export type DiscourseUnitType =
  | 'discourseUnit'
  | 'sentence'
  | 'phrase'
  | 'number'
  | 'word'
  | 'paragraph'
  | 'clause'
  | 'region';

export interface TextDiscourseRow {
  uuid: string;
  type: DiscourseUnitType;
  objInText: number;
  wordOnTablet: number | null;
  childNum: number | null;
  textUuid: string;
  treeUuid: string;
  parentUuid: string | null;
  spellingUuid: string | null;
  spelling: string | null;
  explicitSpelling: string | null;
  transcription: string | null;
}

export interface TextDiscourse extends TextDiscourseRow {
  translations: FieldRow[];
  paragraphLabels: string[];
  epigraphy: TextEpigraphyRow;
  properties: ItemProperty[];
  notes: Note[];
}

export interface TextDiscourseUnit extends TextDiscourse {
  children: TextDiscourseUnit[];
}

export interface NewDiscourseRowPayload {
  spelling: string;
  formUuid: string;
  occurrences: SearchNullDiscourseResultRow[];
}

export interface InsertParentDiscourseRowPayload {
  textUuid: string;
  discourseSelections: TextDiscourseUnit[];
  discourseType: DiscourseUnitType;
  newContent: string;
  properties: AppliedProperty[];
}

export interface DiscourseDisplayUnit {
  uuid: string;
  type: DiscourseUnitType;
  display: string;
}

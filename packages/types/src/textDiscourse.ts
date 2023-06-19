import { SearchNullDiscourseResultRow } from './search';
import { Note } from './notes';
import { AppliedProperty, ItemPropertyWithChildren } from './properties';

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

export interface DiscourseUnit {
  uuid: string;
  type: DiscourseUnitType;
  units: DiscourseUnit[];
  spelling?: string;
  explicitSpelling?: string;
  transcription?: string;
  line?: number;
  wordOnTablet?: number;
  paragraphLabel?: string;
  translation?: string;
  objInText: number;
  side?: number;
  parentUuid?: string;
  childNum?: number;
}

export interface NewDiscourseRowPayload {
  spelling: string;
  formUuid: string;
  occurrences: SearchNullDiscourseResultRow[];
}

export interface TextDiscourseRow {
  uuid: string;
  type: DiscourseUnitType;
  objInText: number | null;
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

export interface TextDiscourseRowPartial {
  uuid: string;
  type: DiscourseUnitType;
  objInText?: number;
  wordOnTablet?: number;
  childNum?: number;
  textUuid: string;
  treeUuid: string;
  parentUuid?: string;
  spellingUuid?: string;
  spelling?: string;
  explicitSpelling?: string;
  transcription?: string;
}

export interface DiscourseProperties {
  properties: ItemPropertyWithChildren[];
  notes: Note[];
}

export interface InsertParentDiscourseRowPayload {
  textUuid: string;
  discourseSelections: DiscourseUnit[];
  discourseType: string;
  newContent: string;
  properties: AppliedProperty[];
}

export interface EditTranslationPayload {
  newTranslation: string;
  textUuid: string;
}

export interface DiscourseSpellingResponse {
  spelling: string;
}

export interface DiscourseDisplayUnit {
  uuid: string;
  type: DiscourseUnitType;
  display: string;
}

export interface DiscourseRow {
  uuid: string;
  type: DiscourseUnitType;
  wordOnTablet: number | null;
  parentUuid: string | null;
  spelling: string | null;
  explicitSpelling: string | null;
  transcription: string | null;
  line: number | null;
  paragraphLabel: string | null;
  translation: string | null;
  objInText: number;
  side: number | null;
  childNum: number | null;
}

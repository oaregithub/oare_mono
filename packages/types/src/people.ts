import { SpellingOccurrenceRow } from './dictionary';
import { DiscourseUnitType } from './textDiscourse';
import { ItemPropertyRow } from './words';

export interface PersonDisplay {
  uuid: string;
  word: string;
  personNameUuid: string | null;
  person: string | null;
  relation: string | null;
  relationPerson: string | null;
  relationPersonUuid: string | null;
  label: string;
  topValueRole: string | null;
  topVariableRole: string | null;
  roleObjUuid: string | null;
  roleObjPerson: string | null;
  textOccurrenceCount: number | null;
  textOccurrenceDistinctCount: number | null;
}

export interface PersonOccurrenceRow extends SpellingOccurrenceRow {
  type: DiscourseUnitType;
  discoursesToHighlight: string[];
}

export interface PersonRow {
  uuid: string;
  nameUuid: string | null;
  relation: string | null;
  relationNameUuid: string | null;
  label: string;
  type: string;
}

export interface PersonListItem {
  person: PersonRow;
  display: string;
  properties: ItemPropertyRow[];
  occurrences: number | null;
}

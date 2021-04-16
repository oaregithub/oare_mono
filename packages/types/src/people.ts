import { EpigraphicTextWithReadings } from './epigraphies';

export interface PersonDisplay {
  uuid: string | null;
  word: string;
  person: string | null;
  relation: string | null;
  relationPerson: string | null;
  relationPersonUuid: string | null;
  label: string;
  topValueRole: string | null;
  topVariableRole: string | null;
  roleObjUuid: string | null;
  roleObjPerson: string | null;
  totalReferenceCount: number;
}

export interface PersonReferences {
  total: number;
  references: EpigraphicTextWithReadings[];
}

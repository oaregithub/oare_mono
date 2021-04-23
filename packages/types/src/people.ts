import { EpigraphicTextWithReadings } from './epigraphies';

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
  totalReferenceCount: number;
}

export interface GetAllPeopleRequest {
  letter: string;
  limit: number;
  offset: number;
}

export interface PersonReferences {
  total: number;
  references: EpigraphicTextWithReadings[];
}

// FIXME should deprecate all sign code things. Still used to create/edit texts so need to replace that first.

import { EpigraphicUnitType, EditorMarkup } from './epigraphies';

export type SignCodeType = 'image' | 'utf8' | 'undetermined';

export interface SignCode {
  uuid?: string;
  signUuid: string | null;
  readingUuid: string | null;
  type: SignCodeType | null;
  code: string | null;
  post?: string;
  sign?: string;
  reading?: string;
  value?: string;
  readingType?: EpigraphicUnitType;
  markup?: EditorMarkup;
}

export interface SignCodeWithUuid extends SignCode {
  uuid: string;
}

export interface SignCodeWithDiscourseUuid extends SignCodeWithUuid {
  discourseUuid: string | null;
}
// END FIXME

export interface SignRow {
  uuid: string;
  name: string;
  fontCode: string;
}

export interface SignOrgRow {
  uuid: string;
  referenceUuid: string;
  type: 'ABZ' | 'MZL';
  orgNum: string;
  hasPNG: boolean;
}

export interface SignReadingRow {
  uuid: string;
  referenceUuid: string;
  type: string; // FIXME could maybe be EpigraphyUnitType but some are missing. Look into updating.
  numName: string | null;
  reading: string;
  value: string;
  frequency: string;
}

export interface SignReadingRowWithOccurrences extends SignReadingRow {
  occurrences: number;
}

export interface Sign extends SignRow {
  orgs: SignOrgRow[];
  readings: SignReadingRowWithOccurrences[];
  occurrences: number;
}

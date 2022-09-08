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
export interface SignList {
  signUuid: string;
  name: string;
  abz: string | null;
  mzl: number | null;
  hasPng: number | null;
  frequency: number | null;
  code: string | null;
  readings: string | null;
}

export interface SignListReading {
  uuid: string;
  value: string;
  type: string;
  count: number | null;
}

export interface SignListResponse {
  result: SignList[];
}

export interface SignListPayload {
  sortBy: string;
  allSigns: string;
}

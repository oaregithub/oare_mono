import { EpigraphicUnitType } from './epigraphies';

export type SignCodeType = 'image' | 'utf8';

export interface SignCode {
  signUuid: string | null;
  readingUuid: string | null;
  type: SignCodeType | null;
  code: string | null;
  post?: string;
  sign?: string;
  reading?: string;
  value?: string;
  readingType?: EpigraphicUnitType;
}

import { Text } from './epigraphies';

export interface SealNameUuid {
  name: string;
  uuid: string;
}

export interface SealInfo extends SealNameUuid {
  imageLinks: string[];
  count: number;
}

export interface SealProperty {
  [name: string]: string;
}

export interface Seal extends SealInfo {
  sealProperties: SealProperty[];
  sealImpressions: Text[];
}

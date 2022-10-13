import { Text } from './epigraphies';

export interface SealNameUuid {
  name: string;
  uuid: string;
}

export interface SealInfo extends SealNameUuid {
  imageLinks: string[];
  count: number;
}

// export interface SealProperties {
//   teissierNumber: number | null;
//   teissierOwnerUser: string | null;
//   thematicElements: string | null;
//   style: string | null;
//   proposedWorkshop: string | null;
//   scene: string | null;
//   sealPrimaryClassification: string | null;
// }
export interface SealProperty {
  [name: string]: string;
}

export interface Seal extends SealInfo {
  sealProperties: SealProperty[];
  sealImpressions: Text[];
}

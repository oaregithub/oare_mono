import { Text } from './text';

// FIXME

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
  sealImpressions: SealImpression[];
}

export interface SealImpression {
  text: Text;
  side: number;
  user: string;
}

export interface AddSealLinkPayload {
  textEpigraphyUuid: string;
  sealUuid: string;
}

import { ItemProperty } from './properties';
import { Text } from './text';

// COMPLETE

export interface SpatialUnitRow {
  uuid: string;
  type: string;
  treeAbb: string;
}

export interface SealCore extends SpatialUnitRow {
  name: string;
  imageLinks: string[];
  occurrences: number;
}

export interface Seal extends SealCore {
  properties: ItemProperty[];
  owner: string | null;
  impressions: SealImpression[];
}

export interface SealImpressionCore {
  textUuid: string;
  side: number | null;
  user: string | null;
}

export interface SealImpression extends SealImpressionCore {
  text: Text;
}

export interface ConnectSealImpressionPayload {
  textEpigraphyUuid: string;
  sealUuid: string;
}

// FIXME

import { Text } from './text';

export interface ResourceRow {
  uuid: string;
  sourceUuid: string | null;
  type: string;
  container: string;
  format: string | null;
  link: string;
}

export interface LinkRow {
  uuid: string;
  referenceUuid: string;
  objUuid: string;
}

export interface ImageProperties {
  side: string | null;
  view: string | null;
}

export interface Image extends ImageProperties {
  resourceRow: ResourceRow | null; // Can be null for CDLI images
  source: string | null;
  url: string;
  text: Text;
}

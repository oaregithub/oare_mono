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

export interface Image {
  resourceRow: ResourceRow | null; // Can be null for CDLI images
  source: string | null;
  url: string;
  text: Text;
  sides: string[];
  views: string[];
}

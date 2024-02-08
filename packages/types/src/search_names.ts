import { PermissionType } from './permissions';

// FIXME

export interface SearchNamesResultRow {
  uuid: string;
  name: string;
  hasEpigraphy: boolean;
}

export interface SearchImagesResultRow {
  uuid: string;
  imgUrl: string;
  name: string;
}

export interface SearchNamesPayload {
  page: number;
  limit: number;
  filter: string;
  groupId?: string;
  type: PermissionType;
  showExcluded: boolean;
}

export interface SearchNamesResponse {
  items: SearchNamesResultRow[];
  count: number;
}

export interface SearchImagesResponse {
  items: SearchImagesResultRow[];
  count: number;
}

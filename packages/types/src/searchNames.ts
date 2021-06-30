import { PermissionsListType } from './permissions';

export interface SearchNamesResultRow {
  uuid: string;
  name: string;
  hasEpigraphy: boolean;
}

export interface SearchNamesPayload {
  page: number;
  limit: number;
  filter: string;
  groupId?: string;
  type: PermissionsListType;
  showExcluded: boolean;
}

export interface SearchNamesResponse {
  items: SearchNamesResultRow[];
  count: number;
}

export type PermissionItem =
  | DictionaryPermission
  | PagePermission
  | TextPermission;

export type PermissionName = PermissionItem['name'];

export interface PermissionTemplate {
  description: string;
  dependencies?: PermissionName[];
}

export interface DictionaryPermission extends PermissionTemplate {
  name:
    | 'UPDATE_WORD_SPELLING'
    | 'UPDATE_TRANSLATION'
    | 'UPDATE_FORM'
    | 'ADD_SPELLING'
    | 'INSERT_DISCOURSE_ROWS'
    | 'ADD_FORM'
    | 'DISCONNECT_SPELLING'
    | 'EDIT_TRANSLITERATION_STATUS';
  type: 'dictionary';
}

export interface PagePermission extends PermissionTemplate {
  name: 'WORDS' | 'NAMES' | 'PLACES' | 'PEOPLE';
  type: 'pages';
}

export interface TextPermission extends PermissionTemplate {
  name:
    | 'VIEW_EPIGRAPHY_IMAGES'
    | 'VIEW_TEXT_DISCOURSE'
    | 'ADD_NEW_TEXTS'
    | 'EDIT_TEXT_INFO'
    | 'EDIT_TRANSLATION';
  type: 'text';
}

export interface UpdatePermissionPayload {
  permission: PermissionItem;
}

export type PermissionsListType = 'Text' | 'Collection';

export interface DenylistAllowlistPayload {
  uuids: string[];
  type: 'text' | 'collection';
}

export interface GetDenylistAllowlistParameters {
  groupId: number;
  type: 'text' | 'collection';
}

export interface DeleteDenylistAllowlistParameters {
  groupId: number;
  uuid: string;
}

export interface DenylistAllowlistItem {
  uuid: string;
  name?: string;
  hasEpigraphy?: boolean;
}

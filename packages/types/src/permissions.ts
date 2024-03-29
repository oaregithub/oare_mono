export type PermissionItem =
  | DictionaryPermission
  | PagePermission
  | TextPermission
  | GeneralPermission
  | SealPermission;

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
    | 'ADD_FORM'
    | 'DISCONNECT_OCCURRENCES'
    | 'CONNECT_SPELLING'
    | 'EDIT_TRANSLITERATION_STATUS'
    | 'ADD_LEMMA';
  type: 'dictionary';
}

export interface PagePermission extends PermissionTemplate {
  name:
    | 'WORDS'
    | 'NAMES'
    | 'PLACES'
    | 'PERSONS'
    | 'BIBLIOGRAPHY'
    | 'SEALS'
    | 'PERIODS';
  type: 'pages';
}

export interface SealPermission extends PermissionTemplate {
  name: 'EDIT_SEAL' | 'ADD_SEAL_LINK';
  type: 'seals';
}
export interface TextPermission extends PermissionTemplate {
  name:
    | 'VIEW_EPIGRAPHY_IMAGES'
    | 'VIEW_TEXT_DISCOURSE'
    | 'VIEW_TEXT_FILE'
    | 'ADD_NEW_TEXTS'
    | 'INSERT_DISCOURSE_ROWS'
    | 'EDIT_TEXT_INFO'
    | 'UPLOAD_EPIGRAPHY_IMAGES'
    | 'EDIT_TRANSLATION'
    | 'INSERT_PARENT_DISCOURSE_ROWS'
    | 'VIEW_TEXT_CITATIONS'
    | 'COPY_TEXT_TRANSLITERATION';
  type: 'text';
}

export interface GeneralPermission extends PermissionTemplate {
  name:
    | 'EDIT_ITEM_PROPERTIES'
    | 'ADD_COMMENTS'
    | 'ADD_EDIT_FIELD_DESCRIPTION'
    | 'VIEW_FIELD_DESCRIPTION';
  type: 'general';
}

export interface UpdatePermissionPayload {
  permission: PermissionItem;
}

export type PermissionsListType = 'Text' | 'Collection' | 'Image';

export interface DenylistAllowlistPayload {
  uuids: string[];
  type: 'text' | 'img' | 'collection';
}

export interface GroupEditPermissionsPayload {
  uuids: string[];
  type: 'text' | 'collection';
}

export interface GetDenylistAllowlistParameters {
  groupId: number;
  type: 'text' | 'collection' | 'img';
}

export interface GetGroupEditPermissionParameters {
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
  url?: string;
  hasEpigraphy?: boolean;
}

export type PermissionItem =
  | DictionaryPermission
  | PagePermission
  | TextPermission
  | GeneralPermission;

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
    | 'EDIT_TRANSLITERATION_STATUS'
    | 'ADD_LEMMA';
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
    | 'VIEW_TEXT_FILE'
    | 'ADD_NEW_TEXTS'
    | 'EDIT_TEXT_INFO'
    | 'UPLOAD_EPIGRAPHY_IMAGES'
    | 'EDIT_TRANSLATION'
    | 'INSERT_PARENT_DISCOURSE_ROWS'
    | 'VIEW_BIBLIOGRAPHY'
    | 'COPY_TEXT_TRANSLITERATION';
  type: 'text';
}

export interface GeneralPermission extends PermissionTemplate {
  name: 'EDIT_ITEM_PROPERTIES' | 'ADD_COMMENTS';
  type: 'general';
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

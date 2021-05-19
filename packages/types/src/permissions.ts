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
    | 'INSERT_DISCOURSE_ROWS';
  type: 'dictionary';
}

export interface PagePermission extends PermissionTemplate {
  name: 'WORDS' | 'NAMES' | 'PLACES' | 'PEOPLE';
  type: 'pages';
}

export interface TextPermission extends PermissionTemplate {
  name: 'VIEW_EPIGRAPHY_IMAGES' | 'VIEW_TEXT_DISCOURSE';
  type: 'text';
}

export interface UpdatePermissionPayload {
  permission: PermissionItem;
}

export type PermissionsListType = 'Text' | 'Collection';

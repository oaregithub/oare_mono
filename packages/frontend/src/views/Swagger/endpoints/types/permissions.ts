export const dictionaryPermissionNames = [
  'UPDATE_WORD_SPELLING',
  'UPDATE_TRANSLATION',
  'UPDATE_FORM',
  'ADD_SPELLING',
  'INSERT_DISCOURSE_ROWS',
  'ADD_FORM',
  'DISCONNECT_SPELLING',
  'EDIT_TRANSLITERATION_STATUS',
];
export const dictionaryPermission = {
  name: {
    type: 'string',
    enum: dictionaryPermissionNames,
  },
  type: {
    type: 'string',
    enum: ['dictionary'],
  },
};

export const pagePermissionNames = ['WORDS', 'NAMES', 'PLACES', 'PEOPLE'];
export const pagePermission = {
  name: {
    type: 'string',
    enum: pagePermissionNames,
  },
  type: {
    type: 'string',
    enum: ['pages'],
  },
};

export const textPermissionNames = [
  'VIEW_EPIGRAPHY_IMAGES',
  'VIEW_TEXT_DISCOURSE',
];
export const textPermission = {
  name: {
    type: 'string',
    enum: textPermissionNames,
  },
  type: {
    type: 'string',
    enum: ['text'],
  },
};

export const permissionName = dictionaryPermissionNames.concat(
  pagePermissionNames,
  textPermissionNames
);

export const permissionTemplate = {
  description: {
    type: 'string',
  },
  dependencies: {
    required: false,
    type: 'array',
    items: {
      type: 'string',
      enum: permissionName,
    },
  },
};

export const dictionaryPermissionWithExtension = {
  ...dictionaryPermission,
  ...permissionTemplate,
};

export const pagePermissionWithExtension = {
  ...pagePermission,
  ...permissionTemplate,
};

export const textPermissionWithExtension = {
  ...textPermission,
  ...permissionTemplate,
};

export const permissionsItems = [
  dictionaryPermissionWithExtension,
  pagePermissionWithExtension,
  textPermissionWithExtension,
];

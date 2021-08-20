const dictionaryPermissionNames = [
  'UPDATE_WORD_SPELLING',
  'UPDATE_TRANSLATION',
  'UPDATE_FORM',
  'ADD_SPELLING',
  'INSERT_DISCOURSE_ROWS',
  'ADD_FORM',
  'DISCONNECT_SPELLING',
  'EDIT_TRANSLITERATION_STATUS',
];
const dictionaryPermission = {
  name: {
    type: 'string',
    enum: dictionaryPermissionNames,
  },
  type: {
    type: 'string',
    enum: ['dictionary'],
  },
};

const pagePermissionNames = ['WORDS', 'NAMES', 'PLACES', 'PEOPLE'];
const pagePermission = {
  name: {
    type: 'string',
    enum: pagePermissionNames,
  },
  type: {
    type: 'string',
    enum: ['pages'],
  },
};

const textPermissionNames = ['VIEW_EPIGRAPHY_IMAGES', 'VIEW_TEXT_DISCOURSE'];
const textPermission = {
  name: {
    type: 'string',
    enum: textPermissionNames,
  },
  type: {
    type: 'string',
    enum: ['text'],
  },
};

const permissionName = dictionaryPermissionNames.concat(
  pagePermissionNames,
  textPermissionNames
);

const permissionTemplate = {
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

const dictionaryPermissionWithExtension = {
  ...dictionaryPermission,
  ...permissionTemplate,
};

const pagePermissionWithExtension = {
  ...pagePermission,
  ...permissionTemplate,
};

const textPermissionWithExtension = {
  ...textPermission,
  ...permissionTemplate,
};

const permissionsItems = [
  dictionaryPermissionWithExtension,
  pagePermissionWithExtension,
  textPermissionWithExtension,
];

// Swagger is unable to use the "anyOf" property in the context of having a potential of three different PermissionItem types to be in the array at the same time.
// as a work around, we are just displaying the 1st out of three permission types that could be returned.
export default {
  '/userpermissions': {
    get: {
      summary: 'Gets user permissions.',
      responses: {
        200: {
          description: 'An array containing the user permissions.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...dictionaryPermissionWithExtension,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/permissions/{groupId}': {
    get: {
      summary: 'Gets permissions associated with a group.',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          required: true,
          description: 'The groupId of a group.',
        },
      ],
      responses: {
        200: {
          description: 'An array containing the group permissions.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...dictionaryPermissionWithExtension,
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'The user is not logged in.',
        },
        403: {
          description:
            'Does not have permission to get permissions of a specific group.',
        },
      },
    },
    post: {
      summary: 'Add permission to group.',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          required: true,
          description: 'The groupId of a group.',
        },
      ],
      requestBody: {
        description: 'Contains the permission to be added to the group.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                permission: dictionaryPermissionWithExtension,
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The permission was successfully added to the group.',
        },
        401: {
          description: 'The user is not logged in.',
        },
        403: {
          description:
            'Does not have permission to add permissions to a specific group.',
        },
      },
    },
  },
  '/permissions/{groupId}/{permission}': {
    delete: {
      summary: 'Deletes a permission from a group.',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          required: true,
          description: 'The groupId of a group.',
        },
        {
          in: 'path',
          name: 'permission',
          enum: permissionName,
          required: true,
          description: 'The name of the permission.',
        },
      ],
      responses: {
        204: {
          description: 'Successfully deleted a permission from the group.',
        },
        401: {
          description: 'The user is not logged in.',
        },
        403: {
          description:
            'Does not have permission to get permissions of a specific group.',
        },
      },
    },
  },
  '/allpermissions': {
    get: {
      summary: 'Gets all permission.',
      responses: {
        200: {
          description: 'An array containing all the permissions.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...dictionaryPermissionWithExtension,
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'The user is not logged in.',
        },
        403: {
          description: 'Does not have permission to get all permissions.',
        },
      },
    },
  },
};

const groupIdDescription = {
  in: 'path',
  name: 'groupId',
  schema: {
    type: 'integer',
  },
  required: true,
};

export default {
  '/collection_groups/{groupId}': {
    get: {
      summary:
        'Get a list of whitelisted and blacklisted collections in a group.',
      parameters: [
        {
          ...groupIdDescription,
          description: 'ID of the group whose collections should be retrieved.',
        },
      ],
      responses: {
        200: {
          description: 'Gets an array of the collections in the group.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    uuid: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                    canRead: {
                      type: 'boolean',
                    },
                    canWrite: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Add a collection to a group for whitelisting/blacklisting',
      parameters: [
        {
          ...groupIdDescription,
          description: 'The ID of the group the collection should be added to',
        },
      ],
      requestBody: {
        description:
          'An object with an "items" property containing a list of the collections to be added to the group',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      uuid: {
                        type: 'string',
                      },
                      canWrite: {
                        type: 'boolean',
                      },
                      canRead: {
                        type: 'boolean',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The collections were successfully added to the group.',
        },
        400: {
          description:
            'Either the group ID is invalid, or one of the collections already belongs to the group',
        },
      },
    },
    patch: {
      summary: 'Update read/write permissions for a collection in a group',
      parameters: [
        {
          ...groupIdDescription,
          description:
            'The ID of the group where the collection permission will be updated',
        },
      ],
      requestBody: {
        description:
          'An object containing the UUID of the collection to update as well as its read/write permissions',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                uuid: {
                  type: 'string',
                },
                canRead: {
                  type: 'boolean',
                },
                canWrite: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  },
};

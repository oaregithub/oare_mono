export default {
  '/public_denylist': {
    get: {
      summary: 'Returns a list of all texts in the public denylist',
      responses: {
        200: {
          description: 'A list of denylist texts',
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
                    hasEpigraphy: {
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
      summary: 'Add a text or collection to the public denylist',
      requestBody: {
        description:
          'An object containing an array of uuids and the type (text or collection)',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                uuids: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                type: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description:
            'The texts or collections were successfually added to the denylist',
        },
        400: {
          description:
            'One or more of the selected texts or collections is already denylisted',
        },
      },
    },
  },
  '/public_denylist/{uuid}': {
    delete: {
      summary: 'Remove a text or collection from the public denylist',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'UUID of the text or collection that should be removed from the denylist',
        },
      ],
      responses: {
        204: {
          description:
            'Text or collection was successfully removed from the denylist',
        },
        400: {
          description: 'The text or collection does not exist in the denylist',
        },
      },
    },
  },
  '/public_denylist/collections': {
    get: {
      summary: 'Returns a list of all collections in the public denylist',
      responses: {
        200: {
          description: 'A list of denylist collections',
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
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

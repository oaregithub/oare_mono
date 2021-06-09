export default {
  '/dictionary/spellings': {
    post: {
      summary: 'Add a new spelling to a form',
      requestBody: {
        description:
          'An object containing a form UUID, a spelling, and discourse UUIDs to attach the spelling to',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                formUuid: {
                  type: 'string',
                },
                spelling: {
                  type: 'string',
                },
                discourseUuids: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Spelling successfully created, returns spelling UUID',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  uuid: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'The spelling already exists on the form',
        },
      },
    },
  },
  '/dictionary/spellings/check': {
    get: {
      summary: 'Checks if a dictionary spelling is valid',
      parameters: [
        {
          in: 'query',
          name: 'spelling',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The spelling to be checked',
        },
      ],
      responses: {
        200: {
          description:
            'An object with an "errors" key describing any errors in the spelling. The array will be empty if the spelling is valid.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  errors: {
                    type: 'array',
                    items: {
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

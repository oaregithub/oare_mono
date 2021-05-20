export default {
  '/collections': {
    get: {
      summary: 'Returns a list of all text collections',
      responses: {
        200: {
          description: 'A list of text collections, sorted by name',
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
  '/collections/{uuid}': {
    get: {
      summary: 'Returns texts belonging to a collection',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The UUID of the collection whose texts should be returned',
        },
        {
          in: 'query',
          name: 'filter',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'A substring of text names',
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'number',
          },
          required: false,
          description: 'The number of rows to return',
        },
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'number',
          },
          required: false,
          description: 'Which page of results to return',
        },
      ],
      responses: {
        200: {
          description:
            'A list of the texts in the collection and the total texts',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  totalTexts: {
                    type: 'number',
                  },
                  texts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'number',
                        },
                        uuid: {
                          type: 'string',
                        },
                        type: {
                          type: 'string',
                        },
                        hasEpigraphy: {
                          type: 'boolean',
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
        403: {
          description:
            'User is not allowed to view the texts in the collection',
        },
      },
    },
  },
};

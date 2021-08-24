const searchNamesResultRow = {
  uuid: {
    type: 'string',
  },
  name: {
    type: 'string',
  },
  hasEpigraphy: {
    type: 'boolean',
  },
};

const permissionsListType = ['Text', 'Collection'];

export default {
  '/search_names': {
    get: {
      summary: 'Gets hierarchical names',
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'number',
          },
          required: true,
          description: 'The pagination page.',
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'number',
          },
          required: true,
          description: 'The limit per pagination page.',
        },
        {
          in: 'query',
          name: 'filter',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The search filter.',
        },
        {
          in: 'query',
          name: 'groupId',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'The group which the user is a part of.',
        },
        {
          in: 'query',
          name: 'type',
          schema: {
            type: 'string',
            enum: permissionsListType,
          },
          required: true,
          description:
            'The list of entities that permissions need to be accounted for.',
        },
        {
          in: 'query',
          name: 'showExcluded',
          schema: {
            type: 'boolean',
          },
          required: true,
          description: 'Gets potentially excluded names.',
        },
      ],
      responses: {
        200: {
          description: 'Returns the names.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: searchNamesResultRow,
                    },
                  },
                  count: {
                    type: 'number',
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

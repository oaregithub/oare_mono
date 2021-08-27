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
      summary:
        'Returns an array of texts/collections that match the searched name.',
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
          description:
            'The group whose allowlist the texts/collections are being added to.',
        },
        {
          in: 'query',
          name: 'type',
          schema: {
            type: 'string',
            enum: permissionsListType,
          },
          required: true,
          description: 'Tells the search what to return, Texts or Collections.',
        },
        {
          in: 'query',
          name: 'showExcluded',
          schema: {
            type: 'boolean',
          },
          required: true,
          description:
            'Toggles visibility of texts/collections that would otherwise be excluded from this list as a result of being in the group allowlist.',
        },
      ],
      responses: {
        200: {
          description: 'Returns the texts/collections.',
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

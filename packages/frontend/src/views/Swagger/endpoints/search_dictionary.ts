import { searchWordsQueryRow } from '@/views/Swagger/endpoints/types/dictionary';

export default {
  '/search_dictionary': {
    get: {
      summary: 'Gets search dictionary results.',
      parameters: [
        {
          in: 'query',
          name: 'spelling',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The spelling to be searched for.',
        },
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
      ],
      responses: {
        200: {
          description: 'Returns words associated with the search.',
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                totalRows: {
                  type: 'string',
                },
                rows: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: searchWordsQueryRow,
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

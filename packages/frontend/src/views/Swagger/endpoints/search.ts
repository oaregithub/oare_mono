import {
  searchDiscourseSpellingResponse,
  searchSpellingResultRow,
  searchTextsResultRow,
  searchNullDiscourseResultRow,
} from './types/search';

export default {
  '/search/spellings/discourse': {
    get: {
      summary: 'Searches for discourse spellings.',
      parameters: [
        {
          in: 'query',
          name: 'spelling',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The spelling to be searched for in discourses.',
        },
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'The pagination page.',
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'The limit per pagination page.',
        },
      ],
      responses: {
        200: {
          description:
            'The spellings that match the searched spelling from discourses.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: searchDiscourseSpellingResponse,
              },
            },
          },
        },
      },
    },
  },
  '/search/spellings': {
    get: {
      summary: 'Searches for all spellings.',
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
            type: 'string',
          },
          required: false,
          description: 'The pagination page.',
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'The limit per pagination page.',
        },
      ],
      responses: {
        200: {
          description: 'The spellings that match the searched spelling.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: searchSpellingResultRow,
                },
              },
            },
          },
        },
      },
    },
  },
  '/search/count': {
    get: {
      summary: 'Search index total count for a text and characters.',
      parameters: [
        {
          in: 'query',
          name: 'textTitle',
          schema: {
            type: 'string',
          },
          required: true,
          description: "The text's title to search against.",
        },
        {
          in: 'query',
          name: 'characters',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'The characters to search for in a text.',
        },
      ],
      responses: {
        200: {
          description: 'The count of matching character occurrences in a text.',
          content: {
            'application/json': {
              schema: {
                type: 'number',
              },
            },
          },
        },
      },
    },
  },
  '/search': {
    get: {
      summary: 'Gets an array of search results.',
      parameters: [
        {
          in: 'query',
          name: 'textTitle',
          schema: {
            type: 'string',
          },
          required: true,
          description: "The text's title to search against.",
        },
        {
          in: 'query',
          name: 'characters',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'The characters to search for in a text.',
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
          name: 'rows',
          schema: {
            type: 'number',
          },
          required: true,
          description: 'The limit per pagination page.',
        },
      ],
      responses: {
        200: {
          description: 'Returns an array of search results.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: searchTextsResultRow,
              },
            },
          },
        },
      },
    },
  },
  '/search/discourse/null/count': {
    get: {
      summary:
        'Gets the count of all null discourses associated with text epigraphies.',
      parameters: [
        {
          in: 'query',
          name: 'characters',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'The characters to search against.',
        },
        {
          in: 'query',
          name: 'includeSuperfluous',
          schema: {
            type: 'boolean',
          },
          required: true,
          description: 'Include superfluous text markup types.',
        },
      ],
      responses: {
        200: {
          description: 'The count of all null instances, regardless of text.',
          content: {
            'application/json': {
              schema: {
                type: 'number',
              },
            },
          },
        },
      },
    },
  },
  '/search/discourse/null': {
    get: {
      summary:
        'Gets a paginated result of all the null discourses associated with text epigraphies.',
      parameters: [
        {
          in: 'query',
          name: 'characters',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'The characters to search against.',
        },
        {
          in: 'query',
          name: 'includeSuperfluous',
          schema: {
            type: 'boolean',
          },
          required: true,
          description: 'Include superfluous text markup types.',
        },
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'number',
          },
          required: true,
          description: 'The current paginated page.',
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'number',
          },
          required: true,
          description: 'The limit per paginated page.',
        },
      ],
      responses: {
        200: {
          description:
            'The paginated null discourses associated with text epigraphies.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: searchNullDiscourseResultRow,
                },
              },
            },
          },
        },
      },
    },
  },
};

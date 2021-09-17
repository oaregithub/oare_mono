import {
  personDisplay,
  personOccurrenceRow,
} from '@/views/Swagger/endpoints/types/people';

export default {
  '/people/{letter}': {
    get: {
      summary: 'Gets people',
      parameters: [
        {
          in: 'path',
          name: 'letter',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The letter to filter people by',
        },
      ],
      responses: {
        200: {
          description: 'An object containing people, partitioned by letter.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: personDisplay,
                },
              },
            },
          },
        },
      },
    },
  },
  '/people/person/{uuid}/occurrences': {
    get: {
      summary: 'Gets person text occurrences.',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The person uuid.',
        },
        {
          in: 'query',
          name: 'filter',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The filter option.',
        },
      ],
      responses: {
        200: {
          description:
            'The number of occurrences of a person found in text discourses.',
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
  '/people/person/{uuid}/texts': {
    get: {
      summary: 'Gets person text information.',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The person uuid.',
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
            type: 'string',
          },
          required: true,
          description: 'The pagination page limit.',
        },
        {
          in: 'query',
          name: 'filter',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The filter option.',
        },
      ],
      responses: {
        200: {
          description:
            'An array of information at each text occurrence the person is found at.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: personOccurrenceRow,
                },
              },
            },
          },
        },
      },
    },
  },
};

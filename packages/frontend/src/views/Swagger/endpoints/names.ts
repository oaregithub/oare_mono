import { word } from './types/dictionary';

export default {
  '/names/{letter}': {
    get: {
      summary: 'Gets names',
      parameters: [
        {
          in: 'path',
          name: 'letter',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The letter to filter names by',
        },
      ],
      responses: {
        200: {
          description: 'An object containing names, partitioned by letter.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: word,
                },
              },
            },
          },
        },
      },
    },
  },
};

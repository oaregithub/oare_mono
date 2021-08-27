import { word } from './types/dictionary';

export default {
  '/words/{letter}': {
    get: {
      summary: 'Gets words',
      parameters: [
        {
          in: 'path',
          name: 'letter',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The letter to filter words by',
        },
      ],
      responses: {
        200: {
          description: 'An object containing words, partitioned by letter.',
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

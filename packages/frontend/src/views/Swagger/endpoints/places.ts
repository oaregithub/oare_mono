import { word } from './types/dictionary';

export default {
  '/places/{letter}': {
    get: {
      summary: 'Gets places',
      parameters: [
        {
          in: 'path',
          name: 'letter',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The letter to filter places by',
        },
      ],
      responses: {
        200: {
          description: 'An object containing places, partitioned by letter.',
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

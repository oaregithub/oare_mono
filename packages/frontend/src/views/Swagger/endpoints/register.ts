import { registerPayload, registerResponse } from './types/register';

export default {
  '/register': {
    post: {
      summary: 'Creates a new user.',
      requestBody: {
        description: 'An object containing the new user.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: registerPayload,
            },
          },
        },
      },
      responses: {
        201: {
          description:
            'The successfully created user along with the access token.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: registerResponse,
              },
            },
          },
        },
        400: {
          description: 'The user already exists.',
        },
        500: {
          description: 'Unable to create the user.',
        },
      },
    },
  },
};

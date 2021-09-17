import {
  allCommentsRequest,
  allCommentsResponse,
  thread,
  threadWithComments,
} from '@/views/Swagger/endpoints/types/threads';

export default {
  '/threads/{referenceUuid}': {
    post: {
      summary: 'Get threads according to the referenceUuid.',
      parameters: [
        {
          in: 'path',
          name: 'referenceUuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The reference uuid of the thread, reference uuid refers to whatever item the thread was created on (e.g. word, form, spelling and in the future it could support more such as texts).',
        },
      ],
      responses: {
        200: {
          description: 'Returns the associated threads with comments.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: threadWithComments,
                },
              },
            },
          },
        },
        401: {
          description: 'User is not logged in.',
        },
      },
    },
  },
  '/threads': {
    put: {
      summary:
        'Updates a thread status and writes a new comment saying what the status was changed from and to.',
      requestBody: {
        description: 'The thread to update the status of.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: thread,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The thread status was successfully updated.',
        },
        401: {
          description: 'User is not logged in.',
        },
        403: {
          description: 'User is not an admin.',
        },
      },
    },
    post: {
      summary: 'Create a new thread',
      requestBody: {
        description:
          'An object containing information about the new thread to create.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                referenceUuid: {
                  type: 'string',
                },
                route: {
                  type: 'string',
                },
                status: {
                  type: 'string',
                  enum: ['New', 'Pending', 'In Progress', 'Completed'],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Returns the uuid of the new thread',
          content: {
            'application/json': {
              schema: {
                type: 'string',
              },
            },
          },
        },
        401: {
          description: 'User is not logged in.',
        },
      },
    },
    get: {
      summary: 'Gets all threads.',
      requestBody: {
        description:
          'An object containing information about getting and filtering threads.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: allCommentsRequest,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Returns threads with associated comments.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: allCommentsResponse,
              },
            },
          },
        },
        401: {
          description: 'User is not logged in.',
        },
      },
    },
  },
  '/threads/name': {
    put: {
      summary: 'Updates the thread name.',
      requestBody: {
        description:
          'An object containing the thread uuid and the new thread name.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                threadUuid: {
                  type: 'string',
                },
                newName: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The thread name was successfully updated.',
        },
        401: {
          description: 'User is not logged in.',
        },
      },
    },
  },
  '/newthreads': {
    get: {
      summary: 'Checks if new threads exist.',
      responses: {
        200: {
          description: 'Signals that a new thread either exists or does not.',
          content: {
            'application/json': {
              schema: {
                type: 'boolean',
              },
            },
          },
        },
        401: {
          description: 'User is not logged in.',
        },
        403: {
          description: 'User is not an admin.',
        },
      },
    },
  },
};

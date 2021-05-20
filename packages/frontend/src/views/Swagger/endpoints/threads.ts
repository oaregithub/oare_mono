export default {
  '/threads': {
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
      },
    },
  },
};

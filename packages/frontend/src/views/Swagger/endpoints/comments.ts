export default {
  '/comments': {
    post: {
      summary: 'Create a new comment',
      requestBody: {
        description: 'An object containing a thread UUID and comment text',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                threadUuid: {
                  type: 'string',
                },
                text: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The comment was successfully added to the thread',
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
  '/comments/{uuid}': {
    delete: {
      summary: 'Delete a comment',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'UUID of the comment that should be deleted',
        },
      ],
      responses: {
        204: {
          description: 'Comment was successfully deleted',
        },
      },
    },
  },
};

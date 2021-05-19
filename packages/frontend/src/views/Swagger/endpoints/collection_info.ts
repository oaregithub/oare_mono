export default {
  '/collection_info/{uuid}': {
    get: {
      summary: 'Returns information about a collection by its UUID.',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'UUID of the collection whose information should be retrieved',
        },
      ],
      responses: {
        200: {
          description:
            'An object containing the name and UUID of a collection.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  uuid: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'The provided collection UUID is invalid/nonexistent.',
        },
      },
    },
  },
};

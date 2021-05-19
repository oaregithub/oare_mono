export default {
  '/cache_status': {
    get: {
      summary: 'Get the status of the backend cache',
      responses: {
        200: {
          description: 'Returns true if the cache is enabled',
          content: {
            'application/json': {
              schema: {
                type: 'boolean',
              },
            },
          },
        },
      },
    },
  },
};

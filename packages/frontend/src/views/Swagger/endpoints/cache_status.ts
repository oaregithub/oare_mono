export default {
  '/cache': {
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
  '/cache/enable': {
    patch: {
      summary: 'Enable the backend cache',
      responses: {
        204: {
          description: 'The cache was successfully enabled',
        },
      },
    },
  },
  '/cache/disable': {
    patch: {
      summary: 'Disable the backend cache',
      description:
        'After disabling the cache, it will automatically be re-enabled after 10 minutes.',
      responses: {
        204: {
          description: 'The cache was successfully disabled',
        },
      },
    },
  },
};

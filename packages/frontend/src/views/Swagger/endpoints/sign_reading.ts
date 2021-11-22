export default {
  '/sign_reading/code/{sign}/{post}': {
    get: {
      summary: 'Returns sign information for a given sign its separator',
      parameters: [
        {
          in: 'path',
          name: 'sign',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The sign whose code information should be retrieved',
        },
        {
          in: 'path',
          name: 'post',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The separator that is used directly after the provided sign',
        },
      ],
      responses: {
        200: {
          description: 'An object containing sign information',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  uuid: {
                    nullable: true,
                    type: 'string',
                  },
                  signUuid: {
                    type: 'string',
                  },
                  readingUuid: {
                    type: 'string',
                  },
                  type: {
                    type: 'string',
                  },
                  code: {
                    type: 'string',
                  },
                  post: {
                    nullable: true,
                    type: 'string',
                  },
                  sign: {
                    nullable: true,
                    type: 'string',
                  },
                  reading: {
                    nullable: true,
                    type: 'string',
                  },
                  value: {
                    nullable: true,
                    type: 'string',
                  },
                  readingType: {
                    nullable: true,
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/sign_reading/format/{sign}': {
    get: {
      summary: 'Returns a formatted version of the passed in sign',
      parameters: [
        {
          in: 'path',
          name: 'sign',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The sign that needs to be formatted',
        },
      ],
      responses: {
        200: {
          description:
            'An array of strings containing the various signs that result from formatting the provided sign',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
};

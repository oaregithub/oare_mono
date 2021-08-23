import { errorStatuses, errorSortTypes } from './types/errors';

export default {
  '/errors': {
    post: {
      summary: 'Create a new error log',
      requestBody: {
        description: 'Creates a new error log',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                },
                stacktrace: {
                  nullable: true,
                  type: 'string',
                },
                status: {
                  type: 'string',
                  enum: errorStatuses,
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Returns if error log was successfully created',
        },
      },
    },
    get: {
      summary: 'Gets error logs',
      parameters: [
        {
          in: 'query',
          name: 'filter',
          schema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: errorStatuses.concat(['']),
              },
              user: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
              stacktrace: {
                type: 'string',
              },
            },
          },
          required: false,
          description: 'The error filter',
        },
        {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: errorSortTypes,
              },
              desc: {
                type: 'boolean',
              },
            },
          },
          required: false,
          description: 'The error sorting',
        },
        {
          in: 'query',
          name: 'pagination',
          schema: {
            type: 'object',
            properties: {
              page: {
                type: 'string',
              },
              limit: {
                type: 'number',
              },
              filter: {
                type: 'string',
                required: false,
              },
            },
          },
          required: false,
          description: 'The error pagination',
        },
      ],
      responses: {
        200: {
          description: 'An object containing paginated error logs',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        userName: {
                          type: 'string',
                        },
                        uuid: {
                          type: 'string',
                        },
                        user_uuid: {
                          type: 'string',
                          nullable: true,
                        },
                        description: {
                          type: 'string',
                        },
                        stacktrace: {
                          type: 'string',
                          nullable: true,
                        },
                        timestamp: {
                          type: 'string',
                        },
                        status: {
                          type: 'string',
                          enum: errorStatuses,
                        },
                      },
                    },
                  },
                  count: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Not logged in',
        },
        403: {
          description: 'Not admin',
        },
      },
    },
    patch: {
      summary: 'Updates error status',
      requestBody: {
        description: 'An object with the error uuids and statuses to update',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                uuids: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                status: {
                  type: 'string',
                  enum: errorStatuses,
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The error log statuses were successfully updated',
        },
        401: {
          description: 'Not logged in',
        },
        403: {
          description: 'Not admin',
        },
      },
    },
  },
  '/newerrors': {
    get: {
      summary: 'Verifies if new error logs exist',
      responses: {
        200: {
          description: 'The new errors logged as returned',
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

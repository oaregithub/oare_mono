export default {
  '/users': {
    get: {
      summary: 'Gets all users.',
      responses: {
        200: {
          description:
            'An object users and the groups the users are associated with.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  uuid: {
                    type: 'string',
                  },
                  firstName: {
                    type: 'string',
                  },
                  lastName: {
                    type: 'string',
                  },
                  email: {
                    type: 'string',
                  },
                  isAdmin: {
                    type: 'boolean',
                  },
                  groups: {
                    type: 'array',
                    items: {
                      type: 'number',
                    },
                  },
                },
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
  '/users/{uuid}': {
    get: {
      summary: 'Returns information about a specific user.',
      description:
        'This route is used when the site is starting up to retrieve the information about the signed-in user. Regular users may only access information about their own account, but admins may access this route for any user.',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'UUID of the user whose information should be retrieved',
        },
      ],
      responses: {
        200: {
          description: 'An object containing basic user information.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  uuid: {
                    type: 'string',
                  },
                  firstName: {
                    type: 'string',
                  },
                  lastName: {
                    type: 'string',
                  },
                  email: {
                    type: 'string',
                  },
                  isAdmin: {
                    type: 'boolean',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'User UUID is invalid/nonexistent',
        },
      },
    },
  },
};

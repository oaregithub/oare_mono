export default {
  '/groups/{id}': {
    get: {
      summary: 'Returns information about a group by its id.',
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'number',
          },
          required: true,
          description: 'Id of the group whose information should be retrieved',
        },
      ],
      responses: {
        200: {
          description: 'Returns if group was successfully found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                  },
                  name: {
                    type: 'string',
                  },
                  created_on: {
                    type: 'string',
                  },
                  num_users: {
                    type: 'number',
                  },
                  description: {
                    nullable: true,
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'User did not send a value group id',
        },
        401: {
          description: 'User is not logged in',
        },
        403: {
          description: 'User is not allowed to get group info',
        },
      },
    },
    delete: {
      summary: 'Deletes a group by id.',
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'number',
          },
          required: true,
          description: 'Id of the group whose information should be deleted',
        },
      ],
      responses: {
        201: {
          description: 'Group was successfully deleted',
        },
        401: {
          description: 'User is not logged in',
        },
        403: {
          description: 'User is not allowed to delete group info',
        },
      },
    },
    patch: {
      summary: 'Updates a group by id.',
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'number',
          },
          required: true,
          description: 'Id of the group whose information should be updated',
        },
      ],
      requestBody: {
        description: 'Payload to updated the group description',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'Group was successfully updated',
        },
        400: {
          description:
            'Group does not exist or the description is greater than 200 characters',
        },
        401: {
          description: 'User is not logged in',
        },
        403: {
          description: 'User is not allowed to delete group info',
        },
      },
    },
  },
  '/groups': {
    get: {
      summary: 'Get all groups',
      responses: {
        200: {
          description: 'All groups were successfully retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'number',
                    },
                    name: {
                      type: 'string',
                    },
                    created_on: {
                      type: 'string',
                    },
                    num_users: {
                      type: 'number',
                    },
                    description: {
                      nullable: true,
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'User is not logged in',
        },
        403: {
          description: 'User is not allowed to get all groups',
        },
      },
    },
    post: {
      summary: 'Create new group',
      requestBody: {
        description: 'Payload to create a new group',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                groupName: {
                  type: 'string',
                },
                description: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The group was successfully created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Group name already exists',
        },
        401: {
          description: 'User is not logged in',
        },
        403: {
          description: 'User is not allowed to create a group',
        },
      },
    },
  },
};

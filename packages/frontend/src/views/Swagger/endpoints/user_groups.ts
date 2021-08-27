import { user } from './types/user';
import { stringArr } from './types/arrays';

export default {
  '/user_groups/{groupId}': {
    get: {
      summary: 'Returns an array of all users associated with the group.',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The id of a group of which users are associated with.',
        },
      ],
      responses: {
        200: {
          description: 'Returns all users associated with the given group.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: user,
                },
              },
            },
          },
        },
        400: {
          description: 'Returns if the group does not exist.',
        },
        401: {
          description: 'Returns if the user is not logged in.',
        },
        403: {
          description: 'Returns if the user is not an admin.',
        },
      },
    },
    post: {
      summary: 'Adds an array of users to the specified group.',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The id of a group of which the users will be associated with.',
        },
      ],
      requestBody: {
        description:
          'Contains an array of userUuids to add to the specified group.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                userUuids: stringArr,
              },
            },
          },
        },
      },
      responses: {
        201: {
          description:
            'Returns if all users were successfully added to the group.',
        },
        400: {
          description:
            'Returns if the group does not exist or one or more of the users already exist in the group.',
        },
        401: {
          description: 'Returns if the user is not logged in.',
        },
        403: {
          description: 'Returns if the user is not an admin.',
        },
      },
    },
    delete: {
      summary: 'removes an array of users from the specified group.',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The id of a group of which users are associated with.',
        },
      ],
      requestBody: {
        description:
          'Contains an array of userUuids to remove to the specified group.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                userUuids: stringArr,
              },
            },
          },
        },
      },
      responses: {
        200: {
          description:
            'Returns if all users were successfully added to the group.',
        },
        400: {
          description: 'Returns if the group does not exist.',
        },
        401: {
          description: 'Returns if the user is not logged in.',
        },
        403: {
          description: 'Returns if the user is not an admin.',
        },
      },
    },
  },
};

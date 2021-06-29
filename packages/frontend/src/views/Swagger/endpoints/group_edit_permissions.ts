export default {
  '/group_edit_permissions/{groupId}/{type}': {
    get: {
      summary:
        'Returns the text or collection edit permissions for the specified group',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          schema: {
            type: 'number',
          },
          required: true,
          description:
            'The group ID whose edit permissions should be retrieved',
        },
        {
          in: 'path',
          name: 'type',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The edit permission type (text or collection)',
        },
      ],
      responses: {
        200: {
          description:
            'A list of texts or collections that the group has permission to edit',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
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
        },
      },
    },
  },
  '/group_edit_permissions/{groupId}': {
    post: {
      summary: "Add texts or collections to a group's edit permissions",
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          schema: {
            type: 'number',
          },
          required: true,
          description:
            'The group ID whose edit permissions list the items should be added to',
        },
      ],
      requestBody: {
        description:
          'An object containing an array of uuids and the type (text or collection)',
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
                type: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description:
            "The texts or collections were successfully added to the group's edit permissions",
        },
        400: {
          description:
            'The group ID specified does not exist or one or more of the UUIDs does not exist',
        },
      },
    },
  },
  '/group_edit_permissions/{groupId}/{uuid}': {
    delete: {
      summary: "Removes a specified item from a group's edit permissions list",
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          schema: {
            type: 'number',
          },
          required: true,
          description:
            'The group ID whose edit permissions the item should be removed from',
        },
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The uuid of the text or collection that should be removed',
        },
      ],
      responses: {
        204: {
          description:
            "The text or collection was successfully removed from the group's edit permissions list",
        },
        400: {
          description:
            'The group ID does not exist or the item cannot be removed from the permissions list because it did not have edit permissions beforehand',
        },
      },
    },
  },
};

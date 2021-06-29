export default {
  '/group_allowlist/{groupId}/{type}': {
    get: {
      summary:
        'Returns the text or collection allowlist for the specified group',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          schema: {
            type: 'number',
          },
          required: true,
          description: 'The group ID whose allowlist should be retrieved',
        },
        {
          in: 'path',
          name: 'type',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The allowlist type (text or collection)',
        },
      ],
      responses: {
        200: {
          description: 'A list of texts or collections in the group allowlist',
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
                    hasEpigraphy: {
                      type: 'boolean',
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
  '/group_allowlist/{groupId}': {
    post: {
      summary: 'Add texts or collections to a group allowlist',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          schema: {
            type: 'number',
          },
          required: true,
          description:
            'The group ID whose allowlist the items should be added to',
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
            'The texts or collections were successfully added to the group allowlist',
        },
        400: {
          description:
            'The group ID specified does not exist or one or more of the UUIDs does not exist',
        },
      },
    },
  },
  '/group_allowlist/{groupId}/{uuid}': {
    delete: {
      summary: 'Removes a specified item from a group allowlist',
      parameters: [
        {
          in: 'path',
          name: 'groupId',
          schema: {
            type: 'number',
          },
          required: true,
          description:
            'The group ID whose allowlist the item should be removed from',
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
            'The text or collection was successfully removed from the group allowlist',
        },
        400: {
          description:
            'The group ID does not exist or the item cannot be removed from the allowlist because it is not in the allowlist',
        },
      },
    },
  },
};

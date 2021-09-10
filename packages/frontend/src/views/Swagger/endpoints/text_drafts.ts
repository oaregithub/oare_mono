import {
  draftPayload,
  textDraft,
  textDraftsResponse,
} from '@/views/Swagger/endpoints/types/textDrafts';

export default {
  '/text_drafts/{draftUuid}': {
    patch: {
      summary: 'Updates a draft.',
      parameters: [
        {
          in: 'path',
          name: 'draftUuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The draft to update.',
        },
        {
          in: 'query',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The user uuid.',
        },
      ],
      requestBody: {
        description: 'Updates the draft.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: draftPayload,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Text draft was successfully updated.',
        },
        400: {
          description: 'If draft does not exist or use cannot edit the text.',
        },
        401: {
          description: 'User has not been authenticated.',
        },
      },
    },
    delete: {
      summary: 'Deletes a draft.',
      parameters: [
        {
          in: 'path',
          name: 'draftUuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The draft to delete.',
        },
        {
          in: 'query',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The user uuid.',
        },
        {
          in: 'query',
          name: 'isAdmin',
          schema: {
            type: 'boolean',
          },
          required: true,
          description: 'The user admin status.',
        },
      ],
      responses: {
        204: {
          description: 'Text draft was successfully deleted.',
        },
        400: {
          description: 'If the user is not an admin or does not own the draft.',
        },
        401: {
          description: 'User has not been authenticated.',
        },
      },
    },
  },
  '/text_drafts/user/{userUuid}': {
    get: {
      summary: 'Gets all drafts by user.',
      parameters: [
        {
          in: 'path',
          name: 'userUuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The user to get drafts for.',
        },
        {
          in: 'query',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The user uuid.',
        },
        {
          in: 'query',
          name: 'isAdmin',
          schema: {
            type: 'boolean',
          },
          required: true,
          description: 'The user admin status.',
        },
      ],
      responses: {
        200: {
          description:
            'Successfully retrieved all drafts associated with the user.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: textDraft,
                },
              },
            },
          },
        },
        401: {
          description: 'User has not been authenticated.',
        },
        403: {
          description:
            'If passed userUuid does not match the userUuid from login and the user is not an admin.',
        },
      },
    },
  },
  '/text_drafts': {
    get: {
      summary: 'Gets all drafts with users.',
      parameters: [
        {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'Column to sort data by.',
        },
        {
          in: 'query',
          name: 'sortOrder',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'Sort either asc or desc.',
        },
        {
          in: 'query',
          name: 'textFilter',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'Text filter.',
        },
        {
          in: 'query',
          name: 'authorFilter',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'Author filter.',
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved all drafts with users.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: textDraftsResponse,
              },
            },
          },
        },
        401: {
          description: 'User has not been authenticated.',
        },
        403: {
          description: 'User is not an admin.',
        },
      },
    },
    post: {
      summary: 'Creates a new draft.',
      parameters: [
        {
          in: 'query',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'Column to sort data by.',
        },
      ],
      requestBody: {
        description: 'Adds a draft.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: draftPayload,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Successfully created a new draft.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    draftUuid: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description:
            'User does not have permission or the draft has already been created.',
        },
        401: {
          description: 'User has not been authenticated.',
        },
      },
    },
  },
};

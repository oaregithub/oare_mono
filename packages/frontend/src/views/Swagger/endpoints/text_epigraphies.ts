import { epigraphyResponse } from '@/views/Swagger/endpoints/types/textEpigraphy';

export default {
  '/text_epigraphies/images/{uuid}/{cdliNum}': {
    get: {
      summary: 'Gets links for images found on both CDLI and S3',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The UUID of the text whose images are being retrieved',
        },
        {
          in: 'path',
          name: 'cdliNum',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The CDLI number for the given text',
        },
      ],
      responses: {
        200: {
          description:
            'Image links were successfully retrieved, returns array of links',
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
  '/text_epigraphies/transliteration': {
    get: {
      summary:
        'Retreives the various transliteration status options and their descriptions',
      responses: {
        200: {
          description:
            'An array of available transliteration status options and meaningss',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    color: {
                      type: 'string',
                    },
                    colorMeaning: {
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
    patch: {
      summary: 'Update the transliteration status of a text',
      requestBody: {
        description:
          "An object containing the text's UUID and the color to set the transliteration status to",
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                textUuid: {
                  type: 'string',
                },
                color: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'The transliteration status was successfully updated',
        },
      },
    },
  },
  '/text_epigraphies/text/{uuid}': {
    get: {
      summary: 'Retrieves the text by uuid.',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The UUID of the text to retrieve.',
        },
      ],
      responses: {
        200: {
          description: 'The text',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: epigraphyResponse,
              },
            },
          },
        },
        400: {
          description:
            'If the text does not exist or the text does not belong to a valid collection.',
        },
        403: {
          description: 'User does not have permission to view the text.',
        },
      },
    },
  },
};

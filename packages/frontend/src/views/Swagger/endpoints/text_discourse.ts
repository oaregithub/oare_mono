import { searchNullDiscourseResultRow } from '@/views/Swagger/endpoints/types/search';

export default {
  '/text_discourse': {
    post: {
      summary: 'Inserts text discourse rows.',
      requestBody: {
        description:
          'Spelling, associated form, associated epigraphies and associated texts.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                spelling: {
                  type: 'string',
                },
                formUuid: {
                  type: 'string',
                },
                occurrences: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: searchNullDiscourseResultRow,
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Successfully inserted the text discourse rows.',
        },
        403: {
          description:
            'User does not have permission to insert discourse rows.',
        },
      },
    },
  },
};

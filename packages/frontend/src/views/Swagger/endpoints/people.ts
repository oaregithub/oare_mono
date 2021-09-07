const personDisplay = {
  uuid: {
    type: 'string',
  },
  word: {
    type: 'string',
  },
  personNameUuid: {
    nullable: true,
    type: 'string',
  },
  person: {
    nullable: true,
    type: 'string',
  },
  relation: {
    nullable: true,
    type: 'string',
  },
  relationPerson: {
    nullable: true,
    type: 'string',
  },
  relationPersonUuid: {
    nullable: true,
    type: 'string',
  },
  label: {
    type: 'string',
  },
  topValueRole: {
    nullable: true,
    type: 'string',
  },
  topVariableRole: {
    nullable: true,
    type: 'string',
  },
  roleObjUuid: {
    nullable: true,
    type: 'string',
  },
  roleObjPerson: {
    nullable: true,
    type: 'string',
  },
  textOccurrenceCount: {
    nullable: true,
    type: 'number',
  },
  textOccurrenceDistinctCount: {
    nullable: true,
    type: 'number',
  },
};

export default {
  '/people/{letter}': {
    get: {
      summary: 'Gets people',
      parameters: [
        {
          in: 'path',
          name: 'letter',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The letter to filter people by',
        },
      ],
      responses: {
        200: {
          description: 'An object containing people, partitioned by letter.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: personDisplay,
                },
              },
            },
          },
        },
      },
    },
  },
};

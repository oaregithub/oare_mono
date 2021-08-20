const stringArr = {
  type: 'array',
  items: {
    type: 'string',
  },
};

const itemProperty = {
  uuid: {
    type: 'string',
  },
  name: {
    type: 'string',
  },
};

const dictionaryFormInfo = {
  uuid: {
    type: 'string',
  },
  form: {
    type: 'string',
  },
};

const dictionaryWordTranslation = {
  uuid: {
    type: 'string',
  },
  translation: {
    type: 'string',
  },
};

const dictionaryFormGrammar = {
  stems: stringArr,
  tenses: stringArr,
  persons: stringArr,
  genders: stringArr,
  grammaticalNumbers: stringArr,
  cases: stringArr,
  states: stringArr,
  moods: stringArr,
  clitics: stringArr,
  morphologicalForms: stringArr,
  suffix: {
    nullable: true,
    type: 'object',
    properties: {
      persons: stringArr,
      genders: stringArr,
      grammaticalNumbers: stringArr,
      cases: stringArr,
    },
  },
};

const formSpelling = {
  uuid: {
    type: 'string',
  },
  spelling: {
    type: 'string',
  },
  hasOccurrence: {
    type: 'boolean',
  },
  htmlSpelling: {
    required: false,
    type: 'string',
  },
};

const dictionaryForm = {
  ...dictionaryFormInfo,
  ...dictionaryFormGrammar,
  ...formSpelling,
};

const itemPropertyRow = {
  ...itemProperty,
  referenceUuid: {
    type: 'string',
  },
  valueUuid: {
    type: 'string',
  },
};

export default {
  '/names/{letter}': {
    get: {
      summary: 'Gets names',
      parameters: [
        {
          in: 'path',
          name: 'letter',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The letter to filter names by',
        },
      ],
      responses: {
        200: {
          description: 'An object containing names, partitioned by letter.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  uuid: {
                    type: 'string',
                  },
                  word: {
                    type: 'string',
                  },
                  partsOfSpeech: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: itemPropertyRow,
                    },
                  },
                  specialClassifications: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: itemPropertyRow,
                    },
                  },
                  translations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: dictionaryWordTranslation,
                    },
                  },
                  verbalThematicVowelTypes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: itemPropertyRow,
                    },
                  },
                  forms: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: dictionaryForm,
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
};

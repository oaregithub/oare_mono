const ItemProperty = {
  type: 'object',
  properties: {
    uuid: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
};

const stringArr = {
  type: 'array',
  items: {
    type: 'string',
  },
};

export default {
  '/dictionary/spellings': {
    post: {
      summary: 'Add a new spelling to a form',
      requestBody: {
        description:
          'An object containing a form UUID, a spelling, and discourse UUIDs to attach the spelling to',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                formUuid: {
                  type: 'string',
                },
                spelling: {
                  type: 'string',
                },
                discourseUuids: {
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
      responses: {
        201: {
          description: 'Spelling successfully created, returns spelling UUID',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  uuid: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'The spelling already exists on the form',
        },
      },
    },
  },
  '/dictionary/spellings/check': {
    get: {
      summary: 'Checks if a dictionary spelling is valid',
      parameters: [
        {
          in: 'query',
          name: 'spelling',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The spelling to be checked',
        },
      ],
      responses: {
        200: {
          description:
            'An object with an "errors" key describing any errors in the spelling. The array will be empty if the spelling is valid.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  errors: {
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
    },
  },
  '/dictionary/{uuid}': {
    get: {
      summary: 'Get grammatical info and forms of a word',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The UUID of the word whose info should be retrieved',
        },
      ],
      responses: {
        200: {
          description: 'An object with the word information',
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
                    items: ItemProperty,
                  },
                  specialClassifications: {
                    type: 'array',
                    items: ItemProperty,
                  },
                  verbalThematicVowelTypes: {
                    type: 'array',
                    items: ItemProperty,
                  },
                  translations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        uuid: {
                          type: 'string',
                        },
                        translation: {
                          type: 'string',
                        },
                      },
                    },
                  },
                  forms: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        uuid: {
                          type: 'string',
                        },
                        form: {
                          type: 'string',
                        },
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
                          type: 'object',
                          nullable: true,
                          properties: {
                            persons: stringArr,
                            genders: stringArr,
                            grammaticalNumbers: stringArr,
                            cases: stringArr,
                          },
                        },
                        spellings: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
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
          },
        },
      },
    },
    patch: {
      summary: 'Update the spelling of a word',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The UUID of the word to update',
        },
      ],
      requestBody: {
        description:
          'An object with a "word" key containing the updated word spelling',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                word: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The spelling was successfully updated',
        },
      },
    },
  },
  '/dictionary/translations/{uuid}': {
    patch: {
      summary: 'Update the translations on a dictionary word',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The UUID of the word whose translations should be updated',
        },
      ],
      requestBody: {
        description:
          'An object with a "translations" key which is an array of translations of the word',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                translations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      uuid: {
                        type: 'string',
                      },
                      translation: {
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
      responses: {
        201: {
          description: 'The translations were successfully updated',
        },
      },
    },
  },
  '/dictionary/forms/{uuid}': {
    patch: {
      summary: "Edit a form's spelling",
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The UUID of the form whose spelling should be updated',
        },
      ],
      requestBody: {
        description:
          'An object with a "newForm" property indicating the new spelling of the form',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                newForm: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The form spelling was successfully updated',
        },
      },
    },
  },
};

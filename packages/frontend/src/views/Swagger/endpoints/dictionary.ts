import { parseTree } from '@/views/Swagger/endpoints/types/dictionary';

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
  '/dictionary/spellings/{uuid}/occurrences': {
    get: {
      summary:
        'Get the number of times a spelling occurs throughout all the texts',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The UUID of the spelling to count. Should be a UUID from the unique_spellings table',
        },
        {
          in: 'query',
          name: 'filter',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'A filter on the text names to search for occurrences',
        },
      ],
      responses: {
        200: {
          description:
            'A number describing the total number of times the spelling occurs',
        },
      },
    },
  },
  '/dictionary/spellings/{uuid}/texts': {
    get: {
      summary: 'Get a list of texts that a spelling appears in',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The UUID of the spelling whose texts should be retrieved',
        },
      ],
      responses: {
        200: {
          description:
            'A list of the texts and lines where the spelling occurs',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    discourseUuid: {
                      type: 'string',
                    },
                    textName: {
                      type: 'string',
                    },
                    textUuid: {
                      type: 'string',
                    },
                    line: {
                      type: 'number',
                    },
                    wordOnTablet: {
                      type: 'number',
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
  '/disconnect/spellings': {
    patch: {
      summary: 'Set spellingUuids to null for the designated text discourses.',
      requestBody: {
        description: 'An array of discourse uuids.',
        required: true,
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
      responses: {
        204: {
          description:
            'Successfully updated the spelling uuids to be null for the designated text discourses.',
        },
        401: {
          description: 'The user is not logged in.',
        },
        403: {
          description:
            'The user does not have permissions to disconnect spellings.',
        },
      },
    },
  },
  '/dictionary/spellings/{uuid}': {
    put: {
      summary: 'Set spellingUuids to null for the designated text discourses.',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The UUID of the spelling whose texts should be updated.',
        },
      ],
      requestBody: {
        description: 'An array of discourse uuids to have a spelling updated.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
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
          description:
            'Successfully updated all the text discourses to have the new spelling.',
        },
        400: {
          description:
            'If the current spelling and the given spelling do not match and the discourse already has a spelling.',
        },
        401: {
          description: 'The user is not logged in.',
        },
        403: {
          description:
            'The user does not have permissions to manipulate forms.',
        },
      },
    },
    delete: {
      summary: 'Deletes a spelling.',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The UUID of the spelling to be deleted.',
        },
      ],
      requestBody: {
        description:
          'An array of discourse uuids that have been updated through the cascading delete of the spelling.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
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
          description: 'Successfully deleted a spelling.',
        },
        401: {
          description: 'The user is not logged in.',
        },
        403: {
          description:
            'The user does not have permissions to manipulate forms.',
        },
      },
    },
  },
  '/dictionary/textDiscourse/{discourseUuid}': {
    get: {
      summary: 'Gets the dictionary information of a specific text discourse.',
      parameters: [
        {
          in: 'path',
          name: 'uuid',
          schema: {
            type: 'string',
          },
          required: true,
          description:
            'The UUID of the text discourse whose dictionary information should be retrieved.',
        },
      ],
      responses: {
        200: {
          description:
            'Successfully retrieved the grammar information and forms of the selected text discourse.',
        },
        400: {
          description: 'Text discourse does not exist.',
        },
      },
    },
  },
  '/dictionary/tree/parse': {
    get: {
      summary: 'Gets all hierarchical data associated in the dictionary.',
      responses: {
        200: {
          description:
            'Successfully retrieved the hierarchical data associated in the dictionary.',
        },
      },
    },
  },
  '/dictionary/addform': {
    put: {
      summary: 'Adds a new form.',
      requestBody: {
        description:
          'An object containing the associated word, the new form spelling and the associated properties to update.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              wordUuid: {
                discourseUuids: {
                  type: 'string',
                },
                formSpelling: {
                  type: 'string',
                },
                properties: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      variable: {
                        type: 'object',
                        properties: parseTree,
                      },
                      value: {
                        type: 'object',
                        properties: parseTree,
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
          description:
            'Successfully added a new form and updated the associated properties.',
        },
        401: {
          description: 'The user is not logged in.',
        },
        403: {
          description: 'The user does not have permissions to add a form.',
        },
      },
    },
  },
};

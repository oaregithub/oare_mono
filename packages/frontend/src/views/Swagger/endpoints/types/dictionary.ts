import { stringArr } from './arrays';

export const itemProperty = {
  uuid: {
    type: 'string',
  },
  name: {
    type: 'string',
  },
};

export const dictionaryFormInfo = {
  uuid: {
    type: 'string',
  },
  form: {
    type: 'string',
  },
};

export const dictionaryWordTranslation = {
  uuid: {
    type: 'string',
  },
  translation: {
    type: 'string',
  },
};

export const dictionaryFormGrammar = {
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

export const formSpelling = {
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

export const dictionaryForm = {
  ...dictionaryFormInfo,
  ...dictionaryFormGrammar,
  ...formSpelling,
};

export const dictionaryFormWithoutSpelling = {
  ...dictionaryFormInfo,
  ...dictionaryFormGrammar,
};

export const itemPropertyRow = {
  ...itemProperty,
  referenceUuid: {
    type: 'string',
  },
  valueUuid: {
    type: 'string',
  },
};

export const word = {
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
};

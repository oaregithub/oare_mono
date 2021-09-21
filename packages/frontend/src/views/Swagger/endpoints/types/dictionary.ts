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

export const spellingOccurrenceRow = {
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

export const searchWordsQueryRowType = ['word', 'PN', 'GN'];
export const searchWordsQueryRow = {
  uuid: {
    type: 'string',
  },
  type: {
    type: 'string',
    enum: searchWordsQueryRowType,
  },
  name: {
    type: 'string',
  },
  translations: {
    nullable: true,
    type: 'string',
  },
  form: {
    nullable: true,
    type: 'string',
  },
  spellings: {
    nullable: true,
    type: 'string',
  },
};

export const parseTree = {
  uuid: {
    type: 'string',
  },
  type: {
    type: 'string',
  },
  parentUuid: {
    type: 'string',
  },
  objectUuid: {
    type: 'string',
  },
  objParentUuid: {
    type: 'string',
  },
  variableName: {
    nullable: true,
    type: 'string',
  },
  valueName: {
    nullable: true,
    type: 'string',
  },
  varAbbreviation: {
    nullable: true,
    type: 'string',
  },
  valAbbreviation: {
    nullable: true,
    type: 'string',
  },
  variableUuid: {
    nullable: true,
    type: 'string',
  },
  valueUuid: {
    nullable: true,
    type: 'string',
  },
  level: {
    nullable: true,
    type: 'number',
  },
  children: {
    nullable: true,
    type: 'array',
    items: {
      type: 'object',
      properties: {}, // Unable to represent the recursive relationship.
    },
  },
};
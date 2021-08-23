import { dictionaryFormWithoutSpelling } from './dictionary';
import { stringArr } from './arrays';

export const discourseLineSpelling = {
  wordOnTablet: {
    type: 'number',
  },
  spelling: {
    type: 'string',
  },
  transcription: {
    nullable: true,
    type: 'string',
  },
};

export const searchDiscourseSpellingRow = {
  uuid: {
    type: 'string',
  },
  line: {
    type: 'number',
  },
  wordOnTablet: {
    type: 'number',
  },
  textUuid: {
    type: 'string',
  },
  textName: {
    type: 'string',
  },
  readings: {
    type: 'array',
    items: {
      type: 'object',
      properties: discourseLineSpelling,
    },
  },
};

export const searchDiscourseSpellingResponse = {
  totalResults: {
    type: 'number',
  },
  rows: {
    type: 'array',
    items: {
      type: 'object',
      properties: searchDiscourseSpellingRow,
    },
  },
};

export const searchSpellingResultRow = {
  wordUuid: {
    type: 'string',
  },
  word: {
    type: 'string',
  },
  form: {
    type: 'object',
    properties: dictionaryFormWithoutSpelling,
  },
};

export const searchTextsResultRow = {
  uuid: {
    type: 'string',
  },
  name: {
    type: 'string',
  },
  matches: stringArr,
  discourseUuids: stringArr,
};

export const searchNullDiscourseLine = {
  textUuid: {
    type: 'string',
  },
  epigraphyUuids: stringArr,
  line: {
    type: 'number',
  },
};

export const searchNullDiscourseResultRow = {
  textName: {
    type: 'string',
  },
  reading: {
    type: 'string',
  },
  ...searchNullDiscourseLine,
};

export const discourseUnitType = [
  'discourseUnit',
  'sentence',
  'phrase',
  'number',
  'word',
  'paragraph',
  'clause',
  'heading',
  'stitch',
  'morpheme',
  null,
];

export const discourseUnit = {
  uuid: {
    type: 'string',
  },
  type: {
    type: 'string',
    enum: discourseUnitType,
  },
  units: {
    type: 'array',
    items: {
      type: 'object',
      properties: {}, // Unable to show recursive relationship (DiscourseUnit should go here).
    },
  },
  spelling: {
    required: false,
    type: 'string',
  },
  transcription: {
    required: false,
    type: 'string',
  },
  line: {
    required: false,
    type: 'number',
  },
  wordOnTablet: {
    required: false,
    type: 'number',
  },
  paragraphLabel: {
    required: false,
    type: 'string',
  },
  translation: {
    required: false,
    type: 'string',
  },
};

import { discourseUnit } from '@/views/Swagger/endpoints/types/textDiscourse';
import { textDraft } from '@/views/Swagger/endpoints/types/textDrafts';

export const collection = {
  uuid: {
    type: 'string',
  },
  name: {
    type: 'string',
  },
};

export const epigraphicUnitSide = [
  'obv.',
  'lo.e.',
  'rev.',
  'u.e.',
  'u.e.',
  'le.e.',
  'r.e.',
  'mirror text',
  'legend',
  'suppl. tablet',
  'vs.!',
  'near hilt',
  'obv. col. i',
  'obv. col. ii',
  'le.e. col. i',
  'le.e. col. ii',
  'le.e. col. iii',
  'col. i',
  'col. ii',
  'col. iii',
  'col. iv',
  'col. v',
  'col. vi',
  "col. i'",
  "col. ii'",
  "col. iii'",
  "col. iv'",
  0,
];

export const epigraphicType = [
  'column',
  'epigraphicUnit',
  'line',
  'number',
  'region',
  'section',
  'separator',
  'sign',
  'stamp',
  'undeterminedLines',
  'undeterminedSigns',
];

export const epigraphicUnitType = [
  'phonogram',
  'logogram',
  'number',
  'determinative',
];

export const markupType = [
  'isCollatedReading',
  'alternateSign',
  'isEmendedReading',
  'erasure',
  'isUninterpreted',
  'isWrittenWithinPrevSign',
  'omitted',
  'originalSign',
  'superfluous',
  'uncertain',
  'isWrittenAsLigature',
  'undeterminedSigns',
  'damage',
  'partialDamage',
  'isWrittenOverErasure',
  'isWrittenBelowTheLine',
  'broken',
  'isSealImpression',
  'uninscribed',
  'ruling',
  'isStampSealImpression',
];

export const markupUnit = {
  referenceUuid: {
    type: 'string',
  },
  type: {
    type: 'string',
    enum: markupType,
  },
  value: {
    nullable: true,
    type: 'number',
  },
  startChar: {
    nullable: true,
    type: 'number',
  },
  endChar: {
    nullable: true,
    type: 'number',
  },
};

export const epigraphicUnit = {
  uuid: {
    type: 'string',
  },
  side: {
    type: 'string',
    enum: epigraphicUnitSide,
  },
  column: {
    type: 'number',
  },
  line: {
    type: 'number',
  },
  charOnLine: {
    type: 'number',
  },
  charOnTablet: {
    type: 'number',
  },
  objOnTablet: {
    type: 'number',
  },
  discourseUuid: {
    nullable: true,
    type: 'string',
  },
  reading: {
    nullable: true,
    type: 'string',
  },
  epigType: {
    type: 'string',
    enum: epigraphicType,
  },
  type: {
    nullable: true,
    type: 'string',
    enum: epigraphicUnitType,
  },
  value: {
    nullable: true,
    type: 'string',
  },
  markups: {
    type: 'array',
    items: {
      type: 'object',
      properties: markupUnit,
    },
  },
  readingUuid: {
    type: 'string',
  },
  signUuid: {
    type: 'string',
  },
};

export const epigraphyResponse = {
  canWrite: {
    type: 'boolean',
  },
  textName: {
    type: 'string',
  },
  collection: {
    type: 'object',
    properties: collection,
  },
  cdliNum: {
    nullable: true,
    type: 'string',
  },
  units: {
    type: 'array',
    items: {
      type: 'object',
      properties: epigraphicUnit,
    },
  },
  color: {
    type: 'string',
  },
  colorMeaning: {
    type: 'string',
  },
  discourseUnits: {
    type: 'array',
    items: {
      type: 'object',
      properties: discourseUnit,
    },
  },
  draft: {
    required: false,
    type: 'object',
    properties: textDraft,
  },
};

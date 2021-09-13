import { spellingOccurrenceRow } from '@/views/Swagger/endpoints/types/dictionary';
import { discourseUnitType } from '@/views/Swagger/endpoints/types/textDiscourse';
import { stringArr } from '@/views/Swagger/endpoints/types/arrays';

export const personDisplay = {
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

export const personOccurrenceRow = {
  ...spellingOccurrenceRow,
  type: {
    type: 'string',
    enum: discourseUnitType,
  },
  discoursesToHighlight: stringArr,
};

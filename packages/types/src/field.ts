// COMPLETE

export interface FieldPayload {
  field: string;
  primacy: number;
  type: FieldType;
}

export interface FieldRow {
  uuid: string;
  referenceUuid: string;
  type: FieldType | null;
  language: string | null;
  primacy: number | null;
  field: string | null;
  sourceUuid: string | null;
}

export type FieldType =
  | 'definition'
  | 'discussionLemma'
  | 'description'
  | 'translation'
  | 'note';

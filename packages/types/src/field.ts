export interface NewFieldPayload {
  referenceUuid: string;
  description: string;
  primacy: number;
  location?: 'taxonomyTree' | 'archive';
}

export interface EditFieldPayload {
  uuid: string;
  description: string;
  primacy: number;
  location?: 'taxonomyTree' | 'archive';
}

export interface DeleteFieldPayload {
  uuid: string;
  referenceUuid: string;
  primacy: number;
  location?: 'taxonomyTree' | 'archive';
  type: string;
}

export interface FieldRow {
  uuid: string;
  referenceUuid: string;
  type: string | null;
  language: string | null;
  primacy: number | null;
  field: string | null;
  sourceUuid: string | null;
}

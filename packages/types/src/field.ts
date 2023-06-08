export interface FieldPayload {
  field: string;
  primacy: number;
  isTaxonomy: boolean;
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

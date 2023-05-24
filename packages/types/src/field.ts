export interface FieldPayload {
  description: string;
  primacy: number;
  isTaxonomy: boolean;
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

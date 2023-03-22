export interface FieldInfo {
  uuid: string | null;
  referenceUuid: string | null;
  field: string | null;
  primacy: number | null;
  language: string | null;
  type: string | null;
}

export interface NewFieldPayload {
  referenceUuid: string;
  description: string;
  primacy: number;
}

export interface EditFieldPayload {
  uuid: string;
  description: string;
  primacy: number;
}

export interface FieldRow {
  id: number;
  uuid: string;
  reference_uuid: string;
  type: string | null;
  language: string | null;
  primary: number | null;
  field: string | null;
}

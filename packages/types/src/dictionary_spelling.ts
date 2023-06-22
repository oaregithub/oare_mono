import { ItemProperty } from './properties';

export interface DictionarySpellingRow {
  uuid: string;
  referenceUuid: string;
  spelling: string;
  explicitSpelling: string;
  mash: string | null;
}

export interface DictionarySpelling extends DictionarySpellingRow {
  hasOccurrence: boolean;
  htmlSpelling: string;
}

export interface AddSpellingPayload {
  formUuid: string;
  spelling: string;
  discourseUuids: string[];
}

export interface DisconnectSpellingPayload {
  discourseUuids: string[];
}

export interface ConnectSpellingPayload {
  discourseUuid: string;
  spellingUuid: string;
}

export interface UpdateSpellingPayload {
  spelling: string;
  discourseUuids: string[];
}

export interface CheckSpellingResponse {
  errors: string[];
}

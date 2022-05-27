import { DictionaryForm } from './dictionary';

export interface ItemPropertyRow {
  uuid: string;
  referenceUuid: string;
  parentUuid: string;
  level: number | null;
  variableUuid: string;
  variableName: string;
  varAbbrevation: string | null;
  valueUuid: string;
  valueName: string;
  valAbbreviation: string | null;
  objectUuid: string;
  value: string;
}

export interface DictionaryWordTranslation {
  uuid: string;
  translation: string;
}

export interface DictionaryWordParseInfo {
  translations: DictionaryWordTranslation[];
  properties: ItemPropertyRow[];
}

export interface Word extends DictionaryWordParseInfo {
  uuid: string;
  word: string;
  forms: DictionaryForm[];
}

export interface DictionaryWord extends DictionaryWordParseInfo {
  uuid: string;
  word: string;
}

export interface WordsResponse {
  words: DictionaryWord[];
}

export interface WordFormAutocompleteDisplay {
  info: { uuid: string; wordUuid: string; name: string };
  wordDisplay: string;
}

export interface WordsInTextSearchPayload {
  uuids: string[][];
  numWordsBetween: number[];
  page: number;
  rows: number;
  sequenced: boolean;
}

export interface WordsInTextSearchPayloadUnparsed {
  uuids: string;
  numWordsBetween: string;
  page: string;
  rows: string;
  sequenced: string;
}

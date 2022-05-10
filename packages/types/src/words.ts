import { DictionaryForm } from './dictionary';

export interface ItemProperty {
  uuid: string;
  name: string;
}

export interface PartialItemPropertyRow extends ItemProperty {
  referenceUuid: string;
  valueUuid: string;
}

export interface ItemPropertyRow {
  uuid: string;
  referenceUuid: string;
  parentUuid: string;
  level: number | null;
  variableUuid: string;
  variableName: string;
  valueUuid: string;
  valueName: string;
  objectUuid: string;
  value: string;
}

export interface DictionaryWordTranslation {
  uuid: string;
  translation: string;
}

export interface DictionaryWordParseInfo {
  partsOfSpeech: PartialItemPropertyRow[];
  specialClassifications: PartialItemPropertyRow[];
  translations: DictionaryWordTranslation[];
  verbalThematicVowelTypes: PartialItemPropertyRow[];
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
  uuid: string;
  wordDisplay: string;
}

export interface WordsInTextSearchPayload {
  uuids: string;
  numWordsBetween: number[];
  page: number;
  rows: number;
  sequenced: string;
}
export interface UuidPayload {
  uuid: string;
}

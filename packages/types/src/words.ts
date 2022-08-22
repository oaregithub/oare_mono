import { DictionaryForm } from './dictionary';

export interface ItemPropertyRow {
  uuid: string;
  referenceUuid: string;
  parentUuid: string;
  level: number | null;
  variableUuid: string | null;
  variableName: string;
  varAbbrevation: string | null;
  valueUuid: string | null;
  valueName: string;
  valAbbreviation: string | null;
  objectUuid: string;
  value: string;
}

export interface DictionaryWordTranslation {
  uuid: string;
  val: string;
}

export interface DictionaryWordParseInfo {
  translationsForDefinition: DictionaryWordTranslation[];
  discussionLemmas: DictionaryWordTranslation[];
  properties: ItemPropertyRow[];
}

export interface Word extends DictionaryWordParseInfo {
  uuid: string;
  word: string;
  forms: DictionaryForm[];
}

export interface WordWithoutForms extends DictionaryWordParseInfo {
  uuid: string;
  word: string;
}

export interface WordFormAutocompleteDisplay {
  info: { uuid: string; wordUuid: string; name: string };
  wordDisplay: string;
}

export interface WordsInTextSearchPayload {
  items: WordsInTextSearchPayloadItem[];
  page: number;
  rows: number;
  sequenced: boolean;
}

export interface WordsInTextSearchPayloadItem {
  uuids: ParseTreePropertyUuids[][] | string[];
  type: 'parse' | 'form';
  numWordsBefore: number | null;
}

export interface WordsInTextSearchPayloadUnparsed {
  items: string;
  page: string;
  rows: string;
  sequenced: string;
}
export interface ParsePropertiesDisplay {
  display: string;
  name: string;
  partOfSpeech: string;
  formUuids: string[];
}

export interface ParseTreePropertyUuids {
  variable: {
    uuid: string;
    parentUuid: string;
    variableName: string | null;
    variableUuid: string | null;
    level: number | null;
  };
  value: {
    uuid: string;
    parentUuid: string;
    valueName: string | null;
    valueUuid: string | null;
    level: number | null;
  };
}

import { DictionaryForm } from './dictionary';
import { AppliedProperty } from './properties';

// FIXME

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
export interface DictItemComboboxDisplay {
  uuid: string;
  referenceUuid: string;
  name: string;
  wordName: string;
  wordUuid: string;
  translations: DictionaryWordTranslation[] | null;
  formInfo: Omit<DictionaryForm, 'spellings'> | null;
  type: 'word' | 'form' | 'spelling' | 'number';
}

export interface WordsInTextSearchPayload {
  items: WordsInTextSearchPayloadItem[];
  page: number;
  rows: number;
  sequenced: boolean;
  sortBy:
    | 'precedingFirstMatch'
    | 'followingLastMatch'
    | 'textNameOnly'
    | 'ascendingNum'
    | 'descendingNum';
}

export interface WordsInTextSearchPayloadItem {
  uuids: string[];
  type: 'parse' | 'form/spelling/number';
  numWordsBefore: number | null;
}

export interface WordsInTextSearchPayloadUnparsed {
  items: string;
  page: string;
  rows: string;
  sequenced: string;
  sortBy:
    | 'precedingFirstMatch'
    | 'followingLastMatch'
    | 'textNameOnly'
    | 'ascendingNum'
    | 'descendingNum';
}

export interface AddWordCheckPayload {
  wordSpelling: string;
  properties: AppliedProperty[];
}

export interface AddWordPayload {
  wordSpelling: string;
  wordType: 'word' | 'PN' | 'GN';
  properties: AppliedProperty[];
}

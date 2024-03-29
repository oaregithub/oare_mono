import { DictionaryWordTranslation, Word, ItemPropertyRow } from './words';
import { SearchTextsResultRow } from './search';
import { AppliedProperty } from './properties';

export interface DisplayableWord {
  uuid: string;
  word: string;
  wordOccurrences: number;
}

export interface FormSpelling {
  uuid: string;
  spelling: string;
  hasOccurrence: boolean;
  htmlSpelling?: string;
}

export interface CheckSpellingResponse {
  errors: string[];
}

export interface DictionaryFormInfo {
  uuid: string;
  form: string;
}

export interface DictionaryFormGrammar {
  stems: string[];
  tenses: string[];
  persons: string[];
  genders: string[];
  grammaticalNumbers: string[];
  cases: string[];
  states: string[];
  moods: string[];
  clitics: string[];
  morphologicalForms: string[];
  suffix: {
    persons: string[];
    genders: string[];
    grammaticalNumbers: string[];
    cases: string[];
  } | null;
}

export interface DictionaryForm extends DictionaryFormInfo {
  spellings: FormSpelling[];
  properties: ItemPropertyRow[];
}

export interface DictionaryFormRow {
  uuid: string;
  referenceUuid: string;
  form: string;
  mash: string;
}

export interface UpdateFormPayload {
  newForm: string;
}

export interface UpdateDictionaryTranslationPayload {
  translations: DictionaryWordTranslation[];
  fieldType: string;
}

export interface UpdateFormSpellingPayload {
  spelling: string;
  discourseUuids: string[];
}

export interface UpdateDictionaryWordPayload {
  word: string;
}

export interface AddFormSpellingPayload {
  formUuid: string;
  spelling: string;
  discourseUuids: string[];
}

export interface AddFormSpellingResponse {
  uuid: string;
}

export interface DiscourseLineSpelling {
  wordOnTablet: number;
  spelling: string;
  transcription: string | null;
}

export interface SearchDiscourseSpellingRow {
  uuid: string;
  line: number;
  wordOnTablet: number;
  textUuid: string;
  textName: string;
  readings: DiscourseLineSpelling[];
}

export interface SearchDiscourseSpellingResponse {
  totalResults: number;
  rows: SearchDiscourseSpellingRow[];
}

export interface SearchSpellingResultRow {
  wordUuid: string;
  word: string;
  form: Omit<DictionaryForm, 'spellings'>;
  spellingUuid: string;
  occurrences: number;
  wordInfo: Word;
}

export interface SearchSpellingPayload {
  spelling: string;
  page?: string;
  limit?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  filter?: string;
}

export interface DictionarySearchRow
  extends Omit<SearchTextsResultRow, 'discourseUuids'> {
  type: 'word' | 'PN' | 'GN';
  translations: string[];
}

export interface DictionarySearchResult {
  totalRows: number;
  results: DictionarySearchRow[];
}

export interface DictionarySearchPayload {
  search: string;
  page: number;
  rows: number;
  mode: string;
  types: string[];
}

export interface TextOccurrencesRow {
  discourseUuid: string;
  textName: string;
  textUuid: string;
}

export interface TextOccurrencesResponseRow extends TextOccurrencesRow {
  discourseUuidsToHighlight: string[];
  readings: string[] | null;
}

export type DictionaryWordTypes = 'word' | 'GN' | 'PN';

export interface AddFormPayload {
  wordUuid: string;
  formSpelling: string;
  properties: AppliedProperty[];
}

export interface InsertItemPropertyRow {
  uuid: string;
  referenceUuid: string;
  parentUuid: string | null;
  level: number | null;
  variableUuid: string | null;
  valueUuid: string | null;
  objectUuid: string | null;
  value: string | null | boolean;
}

export interface DictionaryWordRow {
  uuid: string;
  word: string;
  type: DictionaryWordTypes;
}

export interface EditPropertiesPayload {
  properties: AppliedProperty[];
  wordUuid?: string;
}

export interface ConnectSpellingDiscoursePayload {
  discourseUuid: string;
  spellingUuid: string;
}

export interface TextOccurrencesCountResponseItem {
  uuid: string;
  count: number;
}

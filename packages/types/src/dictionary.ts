import { DictionaryWordTranslation } from './words';
import { SearchTextsResultRow } from './search';

export interface DisplayableWord {
  uuid: string;
  word: string;
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

export interface DictionaryForm
  extends DictionaryFormInfo,
    DictionaryFormGrammar {
  spellings: FormSpelling[];
}

export interface UpdateDictionaryTranslationPayload {
  translations: DictionaryWordTranslation[];
}

export interface UpdateFormSpellingPayload {
  spelling: string;
  discourseUuids: string[];
}

export interface UpdateDictionaryWordPayload {
  word: string;
}

export interface UpdateDictionaryResponse {
  word: string;
}

export interface UpdateDictionaryTranslationsResponse {
  translations: DictionaryWordTranslation[];
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
}

export interface SpellingOccurrenceRow {
  discourseUuid: string;
  textName: string;
  textUuid: string;
  line: number;
  wordOnTablet: number;
}

export interface SpellingOccurrenceResponseRow extends SpellingOccurrenceRow {
  readings: string[];
}

export type DictionaryWordTypes = 'word' | 'GN' | 'PN';

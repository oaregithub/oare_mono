import { DictionaryWordTranslation, Word } from './words';
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

export interface UpdateFormPayload {
  newForm: string;
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

export interface TaxonomyTree {
  uuid: string;
  type: string;
  parentUuid: string;
  objectUuid: string;
  objParentUuid: string;
  variableName: string | null;
  valueName: string | null;
  aliasName: string | null;
  varAbbreviation: string | null;
  valAbbreviation: string | null;
  variableUuid: string | null;
  valueUuid: string | null;
  level: number | null;
  children: TaxonomyTree[] | null;
}

export interface ParseTreeProperty {
  variable: TaxonomyTree;
  value: TaxonomyTree;
}

export interface ParseTreePropertyRow extends ParseTreeProperty {
  uuid: string;
  parentUuid: string;
}

export interface AddFormPayload {
  wordUuid: string;
  formSpelling: string;
  properties: ParseTreeProperty[];
}

export interface InsertItemPropertyRow {
  uuid: string;
  referenceUuid: string;
  parentUuid: string | null;
  level: number | null;
  variableUuid: string | null;
  valueUuid: string | null;
  objectUuid: string | null;
  value: string | null;
}

import { SearchResultRow } from './search';

export interface DictionarySearchRow extends SearchResultRow {
  type: 'word' | 'PN' | 'GN';
  translations: string[];
}

export interface DictionarySearchResult {
  totalRows: number;
  results: DictionarySearchRow[];
}
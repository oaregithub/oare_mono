export interface SearchResultRow {
  uuid: string;
  name: string;
  matches: string[];
}

export interface SearchResult {
  totalRows: number;
  results: SearchResultRow[];
}

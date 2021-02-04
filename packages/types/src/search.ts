export interface SearchTextsResultRow {
  uuid: string;
  name: string;
  matches: string[];
}

export interface SearchTextsPayload {
  characters?: string[];
  textTitle: string;
  page: number;
  rows: number;
}

export interface SearchTextsResponse {
  totalRows: number;
  results: SearchTextsResultRow[];
}

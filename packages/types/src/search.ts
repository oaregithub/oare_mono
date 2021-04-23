export interface SearchTextsResultRow {
  uuid: string;
  name: string;
  matches: string[];
}

export interface SearchTextsPayload {
  characters?: string;
  textTitle: string;
  page: number;
  rows: number;
}

export interface SearchTextsCountPayload {
  characters?: string;
  textTitle: string;
}

export interface SearchTextsResponse {
  results: SearchTextsResultRow[];
}

export interface SearchCooccurrence {
  uuids: string[][];
  type: 'AND' | 'NOT';
}

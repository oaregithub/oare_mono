export interface SearchTextsResultRow {
  uuid: string;
  name: string;
  matches: string[];
  discourseUuids: string[];
}

export interface SearchTextsPayload {
  characters?: string;
  textTitle: string;
  page: number;
  rows: number;
  respectWordBoundaries: string;
  matchWord: string;
}

export interface SearchTextsCountPayload {
  characters?: string;
  textTitle: string;
  respectWordBoundaries: string;
  matchWord: string;
}

export interface SearchTextsResponse {
  results: SearchTextsResultRow[];
}

export interface SearchCooccurrence {
  words: SearchCooccurrenceWord[];
  type: 'AND' | 'NOT';
}

export interface SearchCooccurrenceWord {
  uuids: string[][];
}

export interface SearchNullDiscourseLine {
  textUuid: string;
  epigraphyUuids: string[];
  line: number;
}

export interface SearchNullDiscourseResultRow extends SearchNullDiscourseLine {
  textName: string;
  reading: string;
}

export type SearchType =
  | 'title'
  | 'transliteration'
  | 'words'
  | 'title+transliteration';

export interface SearchFailureRequest {
  type: SearchType;
  query: string;
}

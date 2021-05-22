import { Pagination } from './dictionary';

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

export interface SearchNullDiscourseCountPayload {
  characters: string;
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

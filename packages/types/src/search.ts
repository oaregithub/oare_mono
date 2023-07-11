import { Image } from './resource';
import { Text } from './text';

// FIXME

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
  mode: 'respectNoBoundaries' | 'respectBoundaries' | 'respectAllBoundaries';
}

export interface SearchTextsCountPayload {
  characters?: string;
  textTitle: string;
  mode: 'respectNoBoundaries' | 'respectBoundaries' | 'respectAllBoundaries';
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

// FIXME UPDATED
export type SearchPotentialPermissionsListsType = 'text' | 'img' | 'edit';

export interface SearchPotentialPermissionsListsResponse {
  results: Text[] | Image[];
  count: number;
}

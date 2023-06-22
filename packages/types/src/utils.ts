export type SortOrder = 'asc' | 'desc'; // FIXME should use elsewhere!

export interface Pagination {
  page: number;
  limit: number;
  filter?: string;
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

export interface TextOccurrencesCountResponseItem {
  uuid: string;
  count: number;
}

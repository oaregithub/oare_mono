import { Pagination } from './dictionary';

export interface ErrorsPayload {
  description: string;
  stacktrace: string | null;
  status: ErrorStatus;
}

export interface ErrorsRow {
  uuid: string;
  userUuid: string | null;
  description: string;
  stacktrace: string | null;
  timestamp: Date;
  status: ErrorStatus;
}

export interface ErrorsRowWithUser extends ErrorsRow {
  userName: string;
}

export type ErrorStatus = 'New' | 'In Progress' | 'Resolved';

export interface UpdateErrorStatusPayload {
  uuids: string[];
  status: ErrorStatus;
}

export interface ErrorsResponse {
  errors: ErrorsRowWithUser[];
  count: number;
}

export type SortType = 'status' | 'timestamp' | 'description' | 'userName';

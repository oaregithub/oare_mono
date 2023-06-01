export interface LogErrorPayload {
  description: string;
  stacktrace: string | null;
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

// FIXME should be renamed
export type ErrorsSortType =
  | 'status'
  | 'timestamp'
  | 'description'
  | 'userName';

import { Pagination } from './dictionary';

export interface ErrorsPayload {
  description: string;
  stacktrace: string | null;
  status: ErrorStatus;
}

export interface ErrorsRow {
  uuid: string;
  user_uuid: string | null;
  description: string;
  stacktrace: string | null;
  timestamp: Date;
  status: ErrorStatus;
}

export type ErrorStatus = 'New' | 'In Progress' | 'Resolved';

export interface UpdateErrorStatusPayload {
  uuid: string;
  status: ErrorStatus;
}

export interface ErrorsResponse {
  errors: ErrorsRowWithUser[];
  count: number;
}

export interface ErrorsRowWithUser extends ErrorsRow {
  userName: string;
}

export type SortType = 'status' | 'timestamp' | 'description' | 'userName';

export interface GetErrorsPayload {
  filters: {
    status: ErrorStatus | '';
    user: string;
    description: string;
    stacktrace: string;
  };
  sort: {
    type: SortType;
    desc: boolean;
  };
  pagination: Pagination;
}

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

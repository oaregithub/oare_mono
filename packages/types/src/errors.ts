export interface ErrorsPayload {
  description: string,
  stacktrace: string | null,
  status: string,
}

export interface ErrorsRow {
  uuid: string,
  user_uuid: string | null,
  description: string,
  stacktrace: string | null,
  timestamp: Date,
  status: string,
}
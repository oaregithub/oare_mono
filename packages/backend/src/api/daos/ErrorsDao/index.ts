import knex from '@/connection';
import { ErrorsRow, ErrorStatus, UpdateErrorStatusPayload } from '@oare/types';
import { v4 } from 'uuid';

export interface InsertErrorsRow {
  userUuid: string | null;
  description: string;
  stacktrace: string | null;
  status: ErrorStatus;
}

class ErrorsDao {
  async logError({
    userUuid,
    description,
    stacktrace,
    status,
  }: InsertErrorsRow): Promise<void> {
    const uuid = v4();
    const timestamp = new Date();

    const insertRow: ErrorsRow = {
      uuid,
      user_uuid: userUuid,
      description,
      stacktrace,
      timestamp,
      status,
    };
    await knex('errors').insert(insertRow);
  }

  async getErrorLog(page: number, limit: number): Promise<ErrorsRow[]> {
    const response: ErrorsRow[] = await knex('errors')
      .select(
        'uuid',
        'user_uuid',
        'description',
        'stacktrace',
        'timestamp',
        'status'
      )
      .orderBy('errors.timestamp', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    return response;
  }

  async updateErrorStatus({
    uuid,
    status,
  }: UpdateErrorStatusPayload): Promise<void> {
    await knex('errors').update({ status }).where({ uuid });
  }
}

export default new ErrorsDao();

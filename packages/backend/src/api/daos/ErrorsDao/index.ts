import knex from '@/connection';
import {
  ErrorsRow,
  ErrorStatus,
  UpdateErrorStatusPayload,
  ErrorsResponse,
  ErrorsRowWithUser,
} from '@oare/types';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';

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

  async getErrorLog(page: number, limit: number): Promise<ErrorsResponse> {
    const UserDao = sl.get('UserDao');
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

    const users = await Promise.all(
      response.map(row =>
        row.user_uuid ? UserDao.getUserByUuid(row.user_uuid) : null
      )
    );

    const userNames = users.map(row =>
      row ? `${row.firstName} ${row.lastName}` : 'No User'
    );

    const errors: ErrorsRowWithUser[] = response.map((row, index) => ({
      ...row,
      userName: userNames[index],
    }));

    const totalItems = await knex('errors')
      .count({
        count: knex.raw('distinct uuid'),
      })
      .first();
    let count = 0;
    if (totalItems) {
      count = Number(totalItems.count) || 0;
    }

    return {
      errors,
      count,
    };
  }

  async updateErrorStatus({
    uuid,
    status,
  }: UpdateErrorStatusPayload): Promise<void> {
    await knex('errors').update({ status }).where({ uuid });
  }
}

export default new ErrorsDao();

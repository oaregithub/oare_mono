import knex from '@/connection';
import {
  ErrorsRow,
  ErrorStatus,
  UpdateErrorStatusPayload,
  ErrorsResponse,
  ErrorsRowWithUser,
  GetErrorsPayload,
} from '@oare/types';
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

  async getErrorLog(payload: GetErrorsPayload): Promise<ErrorsResponse> {
    function baseQuery() {
      return knex('errors')
        .select(
          'errors.uuid',
          'errors.user_uuid',
          'errors.description',
          'errors.stacktrace',
          'errors.timestamp',
          'errors.status',
          knex.raw('CONCAT(user.first_name, " ", user.last_name) AS userName')
        )
        .leftJoin('user', 'user.uuid', 'errors.user_uuid')
        .where('errors.status', 'like', `%${payload.filters.status}%`)
        .modify(qb => {
          if (payload.filters.user !== '') {
            qb.where(
              knex.raw('CONCAT(user.first_name, " ", user.last_name)'),
              'like',
              `%${payload.filters.user}%`
            );
          }
        })
        .where('errors.description', 'like', `%${payload.filters.description}%`)
        .modify(qb => {
          if (payload.filters.stacktrace !== '') {
            qb.where(
              'errors.stacktrace',
              'like',
              `%${payload.filters.stacktrace}%`
            );
          }
        });
    }

    const errors: ErrorsRowWithUser[] = await baseQuery()
      .orderBy(payload.sort.type, payload.sort.desc ? 'desc' : 'asc')
      .limit(payload.pagination.limit)
      .offset((payload.pagination.page - 1) * payload.pagination.limit);

    const totalItems = await baseQuery()
      .count({
        count: knex.raw('distinct errors.uuid'),
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

  async newErrorsExist(): Promise<boolean> {
    const exists = await knex('errors').first().where('status', 'New');
    return !!exists;
  }
}

export default new ErrorsDao();

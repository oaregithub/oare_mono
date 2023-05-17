import knex from '@/connection';
import {
  ErrorsRow,
  ErrorStatus,
  ErrorsResponse,
  ErrorsRowWithUser,
  GetErrorsPayload,
} from '@oare/types';
import { Knex } from 'knex';
import { v4 } from 'uuid';

export interface InsertErrorsRow {
  userUuid: string | null;
  description: string;
  stacktrace: string | null;
  status: ErrorStatus;
}

class ErrorsDao {
  async logError(
    { userUuid, description, stacktrace, status }: InsertErrorsRow,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
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
    await k('errors').insert(insertRow);
  }

  async getErrorLog(
    payload: GetErrorsPayload,
    trx?: Knex.Transaction
  ): Promise<ErrorsResponse> {
    const k = trx || knex;
    function baseQuery() {
      return k('errors')
        .select(
          'errors.uuid',
          'errors.user_uuid',
          'errors.description',
          'errors.stacktrace',
          'errors.timestamp',
          'errors.status',
          k.raw('CONCAT(user.first_name, " ", user.last_name) AS userName')
        )
        .leftJoin('user', 'user.uuid', 'errors.user_uuid')
        .where('errors.status', 'like', `%${payload.filters.status}%`)
        .modify(qb => {
          if (payload.filters.user === 'No User') {
            qb.whereNull('errors.user_uuid');
          } else if (payload.filters.user !== '') {
            qb.where(
              k.raw('CONCAT(user.first_name, " ", user.last_name)'),
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
        count: k.raw('distinct errors.uuid'),
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

  async updateErrorStatus(
    uuid: string,
    status: ErrorStatus,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('errors').update({ status }).where({ uuid });
  }

  async newErrorsExist(trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;
    const exists = await k('errors').first().where('status', 'New');
    return !!exists;
  }
}

export default new ErrorsDao();

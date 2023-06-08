import knex from '@/connection';
import {
  ErrorStatus,
  ErrorsResponse,
  ErrorsRowWithUser,
  ErrorsSortType,
} from '@oare/types';
import { Knex } from 'knex';
import { v4 } from 'uuid';

class ErrorsDao {
  /**
   * Logs a new error by inserting a row into the errors table
   * @param userUuid The UUID of the user who encountered the error
   * @param description A brief description of the error
   * @param stacktrace The stacktrace of the error
   * @param status The status of the error. Usually 'New'
   * @param trx Knex Transaction. Optional.
   */
  async logError(
    userUuid: string | null,
    description: string,
    stacktrace: string | null,
    status: ErrorStatus,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    // FIXME perhaps we don't need the status because we can just default to 'New' when logging?

    const uuid = v4();
    const timestamp = new Date();

    await k('errors').insert({
      uuid,
      user_uuid: userUuid,
      description,
      stacktrace,
      timestamp,
      status,
    });
  }

  /**
   * Retrieves a paginated list of errors given the filters, sort, and pagination options
   * @param status The status of the errors to retrieve
   * @param user The user who encountered the error
   * @param description The description of the errors to retrieve
   * @param stacktrace The stacktrace of the errors to retrieve
   * @param type The type of sort to use
   * @param desc Whether to sort in descending order or not
   * @param page The page of results to retrieve
   * @param limit The number of results to retrieve
   * @param trx Knex Transaction. Optional.
   * @returns An object containing the paginated list of errors and the total number of errors
   */
  async getErrorLog(
    status: ErrorStatus | '',
    user: string,
    description: string,
    stacktrace: string,
    type: ErrorsSortType,
    desc: boolean,
    page: number,
    limit: number,
    trx?: Knex.Transaction
  ): Promise<ErrorsResponse> {
    const k = trx || knex;

    function baseQuery() {
      return k('errors')
        .select(
          'errors.uuid',
          'errors.user_uuid as userUuid',
          'errors.description',
          'errors.stacktrace',
          'errors.timestamp',
          'errors.status',
          k.raw('CONCAT(user.first_name, " ", user.last_name) AS userName')
        )
        .leftJoin('user', 'user.uuid', 'errors.user_uuid')
        .where('errors.status', 'like', `%${status}%`)
        .modify(qb => {
          if (user === 'No User') {
            qb.whereNull('errors.user_uuid');
          } else if (user !== '') {
            qb.where(
              k.raw('CONCAT(user.first_name, " ", user.last_name)'),
              'like',
              `%${user}%`
            );
          }
        })
        .where('errors.description', 'like', `%${description}%`)
        .modify(qb => {
          if (stacktrace !== '') {
            qb.where('errors.stacktrace', 'like', `%${stacktrace}%`);
          }
        });
    }

    const errors: ErrorsRowWithUser[] = await baseQuery()
      .orderBy(type, desc ? 'desc' : 'asc')
      .limit(limit)
      .offset((page - 1) * limit);

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

  /**
   * Changes the status of an error
   * @param uuid The UUID of the error to update
   * @param status The new status of the error
   * @param trx Knex Transaction. Optional.
   */
  async updateErrorStatus(
    uuid: string,
    status: ErrorStatus,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('errors').update({ status }).where({ uuid });
  }

  /**
   * Checks to see if there are any new errors in the database
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating if there are new errors
   */
  async newErrorsExist(trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;

    const exists = await k('errors').first().where('status', 'New');

    return !!exists;
  }
}

/**
 * ErrorsDao instance as a singleton
 */
export default new ErrorsDao();

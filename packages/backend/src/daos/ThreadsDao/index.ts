import {
  Thread,
  ThreadStatus,
  ThreadsRow,
  ThreadsSortType,
  Comment,
} from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

// COMPLETE

class ThreadsDao {
  /**
   * Creates a new comment thread.
   * @param referenceUuid The UUID of the item that the thread is referencing.
   * @param name The name of the thread.
   * @param tableReference The table that the thread is referencing.
   * @param trx Knex Transaction. Optional.
   */
  public async createThread(
    referenceUuid: string,
    name: string,
    tableReference: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    const uuid = v4();

    await k('threads').insert({
      uuid,
      reference_uuid: referenceUuid,
      status: 'New',
      table_reference: tableReference,
      name,
    });
  }

  /**
   * Updates the status of a thread.
   * @param uuid The UUID of the thread to update.
   * @param status The new status of the thread.
   * @param trx Knex Transaction. Optional.
   */
  public async updateThreadStatus(
    uuid: string,
    status: ThreadStatus,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('threads').where({ uuid }).update({ status });
  }

  /**
   * Retrieves all thread rows for a given reference UUID.
   * @param referenceUuid The reference UUID to retrieve thread rows for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of thread rows.
   */
  private async getThreadsRowsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<ThreadsRow[]> {
    const k = trx || knex;

    const threadRows: ThreadsRow[] = await k('threads')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'status',
        'table_reference as tableReference',
        'name'
      )
      .where({ reference_uuid: referenceUuid });

    return threadRows;
  }

  /**
   * Constructs thread objects for a given reference UUID.
   * @param referenceUuid The reference UUID to retrieve threads for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of thread objects.
   */
  public async getThreadsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<Thread[]> {
    const CommentsDao = sl.get('CommentsDao');

    const threadRows: ThreadsRow[] = await this.getThreadsRowsByReferenceUuid(
      referenceUuid,
      trx
    );

    const comments: Comment[][] = await Promise.all(
      threadRows.map(row => CommentsDao.getCommentsByThreadUuid(row.uuid, trx))
    );

    const threads: Thread[] = threadRows.map((row, idx) => ({
      ...row,
      comments: comments[idx],
    }));

    return threads;
  }

  /**
   * Retrieves a thread row by UUID.
   * @param uuid The UUID of the thread row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single thread row.
   */
  private async getThreadRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<ThreadsRow> {
    const k = trx || knex;

    const row: ThreadsRow = await k('threads')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'status',
        'table_reference as tableReference',
        'name'
      )
      .where({ uuid })
      .first();

    return row;
  }

  /**
   * Constructs a thread object by UUID.
   * @param uuid The UUID of the thread to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single thread object.
   */
  public async getThreadByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Thread> {
    const CommentsDao = sl.get('CommentsDao');

    const threadRow: ThreadsRow = await this.getThreadRowByUuid(uuid, trx);

    const comments: Comment[] = await CommentsDao.getCommentsByThreadUuid(
      threadRow.uuid
    );

    const thread: Thread = {
      ...threadRow,
      comments,
    };

    return thread;
  }

  /**
   * Updates the name of a thread.
   * @param uuid The UUID of the thread to update.
   * @param name The new name of the thread.
   * @param trx Knex Transaction. Optional.
   */
  public async updateThreadName(
    uuid: string,
    name: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('threads').where({ uuid }).update({ name });
  }

  /**
   * Checks if there are any new threads.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating if there are any new threads.
   */
  public async newThreadsExist(trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;

    const exists = await k('threads').first().where('status', 'New');

    return !!exists;
  }

  /**
   * Retrieves a paginated list of thread UUIDs based on the given parameters.
   * @param status The status of the threads to retrieve.
   * @param name The name of the threads to retrieve.
   * @param sort The field to sort by.
   * @param desc Whether to sort descending.
   * @param page The page number.
   * @param limit The number of threads to retrieve per page.
   * @param trx Knex Transaction. Optional.
   * @returns Paginated array of thread UUIDs.
   */
  public async getAllThreadUuids(
    status: ThreadStatus | '',
    name: string,
    sort: ThreadsSortType,
    desc: boolean,
    page: number,
    limit: number,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids = await k('threads')
      .pluck('uuid')
      .modify(qb => {
        if (status !== '') {
          qb.where({ status });
        }
      })
      .where('name', 'like', `%${name}%`)
      .orderBy(sort, desc ? 'desc' : 'asc')
      .limit(limit)
      .offset((page - 1) * limit);

    return uuids;
  }
}

/**
 * ThreadsDao instance as a singleton.
 */
export default new ThreadsDao();

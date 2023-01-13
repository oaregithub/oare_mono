import {
  AllCommentsRequest,
  Thread,
  ThreadStatus,
  CreateThreadPayload,
  AllThreadRow,
  AllThreadResponse,
  AllThreadRowUndeterminedItem,
} from '@oare/types';
import { knexRead, knexWrite } from '@/connection';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import { determineThreadItem } from './utils';

const NULL_THREAD_NAME = 'Untitled';

const isNullThreadName = (name: string): boolean =>
  NULL_THREAD_NAME.includes(name) ||
  NULL_THREAD_NAME.toLowerCase().includes(name);

class ThreadsDao {
  async insert(
    { referenceUuid, route }: CreateThreadPayload,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knexWrite();
    const newUuid: string = v4();
    const status: ThreadStatus = 'New';
    await k('threads').insert({
      uuid: newUuid,
      reference_uuid: referenceUuid,
      status,
      route,
    });

    return newUuid;
  }

  async update(
    { uuid, status }: Thread,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('threads').where('uuid', uuid).update({
      status,
    });
  }

  async getByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<Thread[]> {
    const k = trx || knexRead();
    const thread: Thread[] = await k('threads')
      .select(
        'threads.uuid AS uuid',
        'threads.reference_uuid AS referenceUuid',
        'threads.status AS status',
        'threads.route AS route',
        'threads.name AS name'
      )
      .where('reference_uuid', referenceUuid);

    return thread;
  }

  async getByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Thread | null> {
    const k = trx || knexRead();
    const thread: Thread | null = await k('threads')
      .first(
        'threads.uuid AS uuid',
        'threads.reference_uuid AS referenceUuid',
        'threads.status AS status',
        'threads.route AS route',
        'threads.name AS name'
      )
      .where('uuid', uuid);

    return thread;
  }

  async updateThreadName(
    uuid: string,
    newName: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('threads').where({ uuid }).update({
      name: newName,
    });
  }

  async getAll(
    request: AllCommentsRequest,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<AllThreadResponse> {
    const k = trx || knexRead();
    const userDao = sl.get('UserDao');
    const isAdmin = userUuid ? await userDao.userIsAdmin(userUuid, trx) : false;

    const baseQuery = () =>
      k('threads')
        .select(
          'threads.uuid AS uuid',
          'threads.name AS name',
          'threads.reference_uuid AS referenceUuid',
          'threads.status AS status',
          'threads.route AS route',
          'comments.comment AS comment',
          'comments.user_uuid AS userUuid',
          'comments.created_at AS timestamp',
          k.raw('MAX(comments.created_at) AS timestamp'),
          'dictionary_word.word as word',
          'dictionary_form.form as form',
          'dictionary_spelling.spelling as spelling',
          'field.field as definition',
          'collection.name as collectionName'
        )
        .innerJoin('comments', 'threads.uuid', 'comments.thread_uuid')
        .leftJoin(
          'dictionary_word',
          'threads.reference_uuid',
          'dictionary_word.uuid'
        )
        .leftJoin(
          'dictionary_form',
          'threads.reference_uuid',
          'dictionary_form.uuid'
        )
        .leftJoin(
          'dictionary_spelling',
          'threads.reference_uuid',
          'dictionary_spelling.uuid'
        )
        .leftJoin('field', 'threads.reference_uuid', 'field.uuid')
        .leftJoin('collection', 'threads.reference_uuid', 'collection.uuid')
        .modify(qb => {
          if (request.filters.status !== ('All' as ThreadStatus)) {
            qb.where('threads.status', request.filters.status);
          }

          if (request.filters.thread !== '') {
            qb.andWhere(function () {
              this.where(
                'threads.name',
                'like',
                `%${request.filters.thread}%`
              ).modify(qbInner => {
                if (isNullThreadName(request.filters.thread)) {
                  qbInner.orWhereNull('threads.name');
                }
              });
            });
          }

          if (request.filters.item !== '') {
            qb.andWhere(function () {
              this.where(
                'dictionary_word.word',
                'like',
                `%${request.filters.item}%`
              )
                .orWhere(
                  'dictionary_form.form',
                  'like',
                  `%${request.filters.item}%`
                )
                .orWhere('field.field', 'like', `%${request.filters.item}%`)
                .orWhere(
                  'collection.name',
                  'like',
                  `%${request.filters.item}%`
                );
            });
          }

          if (request.filters.comment !== '') {
            qb.andWhere('comment', 'like', `%${request.filters.comment}%`);
          }

          // Only display threads from user if not admin OR using the comments page from the user dashboard.
          if (!isAdmin || request.isUserComments) {
            qb.andWhere('comments.user_uuid', userUuid);
          }
        })
        .groupBy('threads.uuid');

    const threads: AllThreadRow[] = await baseQuery()
      .orderBy(request.sort.type, request.sort.desc ? 'desc' : 'asc')
      .limit(request.pagination.limit)
      .offset((request.pagination.page - 1) * request.pagination.limit)
      .then((undertiminedItemThreads: AllThreadRowUndeterminedItem[]) =>
        determineThreadItem(undertiminedItemThreads)
      );

    const count = (await baseQuery()).length;

    return {
      threads,
      count,
    };
  }

  async newThreadsExist(trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knexRead();
    const exists = await k('threads').first().where('status', 'New');
    return !!exists;
  }
}

export default new ThreadsDao();

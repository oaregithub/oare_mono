import { AllCommentsRequest, Thread } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';

export interface ThreadWordRow {
  word: string;
  form: string;
  spelling: string;
}

interface ThreadUuid {
  uuid: string;
}

interface AllThreadRow extends Thread {
  comment: string;
  userUuid: string;
  timestamp: string;
  item: string | null;
}

interface AllThreadResponse {
  threads: AllThreadRow[];
  count: number;
}

const NULL_THREAD_NAME = 'Untitled';

const isNullThreadName = (name: string): boolean =>
  NULL_THREAD_NAME.includes(name) ||
  NULL_THREAD_NAME.toLowerCase().includes(name);

class ThreadsDao {
  async insert({ referenceUuid, status, route }: Thread): Promise<string> {
    const newUuid: string = v4();
    await knex('threads').insert({
      uuid: newUuid,
      reference_uuid: referenceUuid,
      status,
      route,
    });

    return newUuid;
  }

  async update({ uuid, status }: Thread): Promise<void> {
    await knex('threads').where('uuid', uuid).update({
      status,
    });
  }

  async getByReferenceUuid(referenceUuid: string): Promise<Thread[]> {
    const thread: Thread[] = await knex('threads')
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

  async getByUuid(uuid: string): Promise<Thread | null> {
    const thread: Thread | null = await knex('threads')
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

  async updateThreadName(uuid: string, newName: string): Promise<void> {
    await knex('threads').where({ uuid }).update({
      name: newName,
    });
  }

  async getThreadWord(uuid: string): Promise<string | null> {
    const thread: ThreadWordRow | null = await knex('threads')
      .first(
        'dictionary_word.word AS word',
        'dictionary_form.form AS form',
        'dictionary_spelling.spelling AS spelling'
      )
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
      .where('threads.uuid', uuid);

    let word = null;

    if (thread) {
      if (thread.word) {
        word = thread.word;
      } else if (thread.form) {
        word = thread.form;
      } else if (thread.spelling) {
        word = thread.spelling;
      }
    }

    return word;
  }

  async getAllThreadUuidsByUserUuid(
    userUuid: string,
    mostRecent = false
  ): Promise<string[]> {
    const threads: ThreadUuid[] = await knex('threads')
      .distinct('threads.uuid')
      .innerJoin('comments', 'threads.uuid', 'comments.thread_uuid')
      .where('comments.user_uuid', userUuid)
      .orderBy('comments.created_at', mostRecent ? 'desc' : 'asc');

    return threads.map(thread => thread.uuid);
  }

  async getAll(
    request: AllCommentsRequest,
    userUuid: string | null
  ): Promise<AllThreadResponse> {
    const userDao = sl.get('UserDao');
    const isAdmin = userUuid ? await userDao.userIsAdmin(userUuid) : false;

    const baseQuery = () =>
      knex('threads')
        .select(
          'threads.uuid AS uuid',
          'threads.name AS name',
          'threads.reference_uuid AS referenceUuid',
          'threads.status AS status',
          'threads.route AS route',
          'comments.comment AS comment',
          'comments.user_uuid AS userUuid',
          'comments.created_at AS timestamp',
          knex.raw('MAX(comments.created_at) AS timestamp'),
          knex.raw(
            'IFNULL(dictionary_word.word, IFNULL(dictionary_form.form, IFNULL(dictionary_spelling.spelling, NULL))) AS item'
          )
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
        .modify(qb => {
          if (request.filters.status.length !== 0) {
            qb.whereIn('threads.status', request.filters.status);
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
                .orWhere(
                  'dictionary_spelling.spelling',
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
      .offset((request.pagination.page - 1) * request.pagination.limit);

    const count = (await baseQuery()).length;

    return {
      threads,
      count,
    };
  }
}

export default new ThreadsDao();

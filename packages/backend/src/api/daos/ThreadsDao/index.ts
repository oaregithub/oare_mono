import { Thread } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';


class ThreadsDao {
  async insert(thread: Thread): Promise<void> {
    await knex('threads').insert({
      uuid: v4(),
      reference_uuid: thread.referenceUuid,
      status: thread.status,
      route: thread.route,
    });
  }

  async getByReferenceUuid(referenceUuid: string): Promise<Thread[]> {
    const threads: Thread[] = await knex('threads')
      .select('threads.*')
      .where('reference_uuid', referenceUuid);

    return threads;
  }
}

export default new ThreadsDao();

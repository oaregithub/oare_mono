import { Thread } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';

class ThreadsDao {
  async insert({
    uuid,
    referenceUuid,
    status,
    route,
  }: Thread): Promise<string> {
    const newUuid: string = v4();
    await knex('threads').insert({
      uuid: newUuid,
      reference_uuid: referenceUuid,
      status,
      route,
    });

    return newUuid;
  }

  async getByReferenceUuid(referenceUuid: string): Promise<Thread[] | null> {
    const thread: Thread[] | null = await knex('threads')
      .first('threads.*')
      .where('reference_uuid', referenceUuid);

    return thread;
  }
}

export default new ThreadsDao();

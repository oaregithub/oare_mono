import { Thread } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';

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
        'threads.name AS name',
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
        'threads.name AS name',
      )
      .where('uuid', uuid);

    return thread;
  }

  async updateThreadName(uuid: string, newName: string): Promise<void> {
    await knex('threads').where('uuid', uuid).update({
      name: newName,
    });
  }
}

export default new ThreadsDao();

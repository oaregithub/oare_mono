import { Thread } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';

export interface ThreadWordRow {
  word: string;
  form: string;
  spelling: string;
}

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
        'threads.route AS route'
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
        'threads.route AS route'
      )
      .where('uuid', uuid);

    return thread;
  }

  async getThreadWord(uuid: string): Promise<string | null> {
    const thread: ThreadWordRow | null = await knex('threads')
      .first(
        'dictionary_word.word AS word',
        'dictionary_form.form AS form',
        'dictionary_spelling.spelling AS spelling',
      )
      .leftJoin('dictionary_word', 'threads.reference_uuid', 'dictionary_word.uuid')
      .leftJoin('dictionary_form', 'threads.reference_uuid', 'dictionary_form.uuid')
      .leftJoin('dictionary_spelling', 'threads.reference_uuid', 'dictionary_spelling.uuid')
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
}

export default new ThreadsDao();

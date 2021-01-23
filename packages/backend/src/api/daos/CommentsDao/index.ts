import { Comment } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';

class CommentsDao {
  async insert({ uuid, threadUuid, userUuid, createdAt, deleted, text }: Comment): Promise<string> {
    const newUuid: string = v4();
    await knex('comments').insert({
      uuid: newUuid,
      thread_uuid: threadUuid,
      user_uuid: userUuid,
      created_at: createdAt,
      deleted,
      comment: text,
    });

    return newUuid;
  }
}

export default new CommentsDao();

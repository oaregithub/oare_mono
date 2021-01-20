import { Comment } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';

class CommentsDao {
  async insert(comment: Comment): Promise<void> {
    await knex('comments').insert({
      uuid: v4(),
      thread_uuid: comment.threadUuid,
      user_uuid: comment.userUuid,
      created_at: comment.createdAt,
      deleted: comment.deleted ? 1 : 0,
      comment: comment.text,
    });
  }
}

export default new CommentsDao();

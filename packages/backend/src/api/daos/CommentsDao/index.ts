import { Comment, CommentInsert } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';

class CommentsDao {
  async insert({ uuid, threadUuid, userUuid, createdAt, deleted, text }: CommentInsert): Promise<string> {
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

  async getAllByThreadUuid(threadUuid: string): Promise<Comment[]> {
    const comments = await knex('comments')
      .select(
        'comments.uuid',
        'comments.thread_uuid AS threadUuid',
        'comments.user_uuid AS userUuid',
        'comments.created_at AS createdAt',
        'comments.deleted',
        'comments.comment AS text',
      )
      .where('comments.thread_uuid', threadUuid);

    return comments;
  }
}

export default new CommentsDao();

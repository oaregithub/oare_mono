import { Comment, CommentInsert } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';

class CommentsDao {
  async insert({
    threadUuid,
    userUuid,
    createdAt,
    deleted,
    text,
  }: CommentInsert): Promise<string> {
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

  async updateDelete(uuid: string): Promise<void> {
    await knex('comments').where({ uuid }).update({
      deleted: true,
    });
  }

  async getAllByThreadUuid(threadUuid: string): Promise<Comment[]> {
    const comments = await knex('comments')
      .select(
        'comments.uuid',
        'comments.thread_uuid AS threadUuid',
        'comments.user_uuid AS userUuid',
        'comments.created_at AS createdAt',
        'comments.deleted',
        'comments.comment AS text'
      )
      .where('comments.thread_uuid', threadUuid)
      .orderBy('comments.created_at');

    return comments;
  }

  async getAllByUserUuidGroupedByThread(userUuid: string): Promise<Comment[]> {
    const comments = await knex('comments')
      .select(
        'comments.uuid',
        'comments.thread_uuid AS threadUuid',
        'comments.user_uuid AS userUuid',
        'comments.created_at AS createdAt',
        'comments.deleted',
        'comments.comment AS text'
      )
      .where('comments.user_uuid', userUuid)
      .orderBy('comments.created_at')
      .groupBy('comments.thread_uuid');

    return comments;
  }
}

export default new CommentsDao();

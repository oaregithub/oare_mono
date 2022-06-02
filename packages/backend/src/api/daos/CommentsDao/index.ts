import { Comment, CreateCommentPayload } from '@oare/types';
import { knexRead, knexWrite } from '@/connection';
import { v4 } from 'uuid';
import { Knex } from 'knex';

class CommentsDao {
  async insert(
    userUuid: string,
    { threadUuid, text }: CreateCommentPayload,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knexWrite();
    const newUuid: string = v4();
    await k('comments').insert({
      uuid: newUuid,
      thread_uuid: threadUuid,
      user_uuid: userUuid,
      created_at: new Date(),
      deleted: false,
      comment: text,
    });

    return newUuid;
  }

  async updateDelete(uuid: string, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knexWrite();
    await k('comments').where({ uuid }).update({
      deleted: true,
    });
  }

  async getAllByThreadUuid(
    threadUuid: string,
    mostRecent = false,
    trx?: Knex.Transaction
  ): Promise<Comment[]> {
    const k = trx || knexRead();
    const comments = await k('comments')
      .select(
        'comments.uuid',
        'comments.thread_uuid AS threadUuid',
        'comments.user_uuid AS userUuid',
        'comments.created_at AS createdAt',
        'comments.deleted',
        'comments.comment AS text'
      )
      .where('comments.thread_uuid', threadUuid)
      .orderBy('comments.created_at', mostRecent ? 'desc' : 'asc');

    return comments;
  }
}

export default new CommentsDao();

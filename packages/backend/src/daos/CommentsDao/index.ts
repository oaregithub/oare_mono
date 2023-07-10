import { CommentsRow, Comment } from '@oare/types';
import knex from '@/connection';
import { v4 } from 'uuid';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

class CommentsDao {
  /**
   * Creates a new comment.
   * @param threadUuid The UUID of the thread that the comment is in.
   * @param userUuid The UUID of the user that created the comment.
   * @param comment The comment text.
   * @param trx Knex Transaction. Optional.
   */
  public async createComment(
    threadUuid: string,
    userUuid: string,
    comment: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    const uuid = v4();

    await k('comments').insert({
      uuid,
      thread_uuid: threadUuid,
      user_uuid: userUuid,
      created_at: new Date(),
      deleted: false,
      comment,
    });
  }

  /**
   * Marks a comment as deleted. Comments are not actually deleted from the database.
   * @param uuid The UUID of the comment to mark as deleted.
   * @param trx Knex Transaction. Optional.
   */
  public async markAsDeleted(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('comments').where({ uuid }).update({ deleted: true });
  }

  /**
   * Retrieves all comment rows for a given thread UUID.
   * @param threadUuid The thread UUID to retrieve comment rows for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of comment rows.
   */
  private async getCommentsRowsByThreadUuid(
    threadUuid: string,
    trx?: Knex.Transaction
  ): Promise<CommentsRow[]> {
    const k = trx || knex;

    const commentRows: CommentsRow[] = await k('comments')
      .select(
        'uuid',
        'thread_uuid as threadUuid',
        'user_uuid as userUuid',
        'created_at as createdAt',
        'deleted',
        'comment'
      )
      .where({ thread_uuid: threadUuid })
      .then(rows => rows.map(r => ({ ...r, deleted: !!r.deleted })));

    return commentRows;
  }

  /**
   * Constructs comment objects for a given thread UUID.
   * @param threadUuid The thread UUID to retrieve comments for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of comments.
   * @throws Error if one or more comments reference a non-existent user.
   */
  public async getCommentsByThreadUuid(
    threadUuid: string,
    trx?: Knex.Transaction
  ): Promise<Comment[]> {
    const UserDao = sl.get('UserDao');

    const commentsRows = await this.getCommentsRowsByThreadUuid(
      threadUuid,
      trx
    );

    const users = await Promise.all(
      commentsRows.map(r => UserDao.getUserByUuid(r.userUuid, trx))
    );

    const comments: Comment[] = commentsRows.map((row, idx) => ({
      ...row,
      user: users[idx],
    }));

    return comments;
  }

  /**
   * Checks if a comment exists.
   * @param uuid The UUID of the comment to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the comment exists.
   */
  public async commentExists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const exists = await k('comments').where({ uuid }).first();

    return !!exists;
  }
}

/**
 * CommentsDao instance as a singleton.
 */
export default new CommentsDao();

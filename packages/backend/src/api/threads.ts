import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { CommentDisplay, Thread, ThreadWithComments, Comment } from '@oare/types';

const router = express.Router();

router.route('/threads/:referenceUuid').get(async (req, res, next) => {
  try {
    const { referenceUuid } = req.params;
    const threadsDao = sl.get('ThreadsDao');
    const commentsDao = sl.get('CommentsDao');
    const userDao = sl.get('UserDao');

    const threads: Thread[] | null = await threadsDao.getByReferenceUuid(referenceUuid);
    let results: ThreadWithComments[] = [];

    const getUsersByComments = async (comments: Comment[]): Promise<CommentDisplay[]> => {
      return Promise.all(
        comments.map((comment: Comment) =>
          userDao.getUserByUuid(comment.userUuid).then((user) => {
            return {
              uuid: comment.uuid,
              threadUuid: comment.threadUuid,
              userUuid: comment.userUuid ? comment.userUuid : null,
              userFirstName: user ? user.firstName : '',
              userLastName: user ? user.lastName : '',
              createdAt: new Date(comment.createdAt),
              deleted: comment.deleted,
              text: comment.text,
            } as CommentDisplay;
          }),
        ),
      );
    };

    if (threads) {
      results = await Promise.all(
        threads.map((thread) =>
          commentsDao.getAllByThreadUuid(thread.uuid || '').then((comments) => {
            return getUsersByComments(comments).then((commentDisplays) => {
              return {
                thread,
                comments: commentDisplays,
              } as ThreadWithComments;
            });
          }),
        ),
      );
    }

    res.json(results);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/threads').put(async (req, res, next) => {
  try {
    const thread: Thread = req.body;
    const threadsDao = sl.get('ThreadsDao');
    const commentsDao = sl.get('CommentsDao');
    const userDao = sl.get('UserDao');

    const prevThread = await threadsDao.getByUuid(thread.uuid || '');
    if (prevThread === null) {
      throw new HttpInternalError('Previous Thread was not found');
    }

    await threadsDao.update(thread);

    await commentsDao.insert({
      uuid: null,
      threadUuid: thread.uuid,
      userUuid: null,
      createdAt: new Date(),
      deleted: false,
      text: `The status was changed from ${prevThread?.status} to ${thread.status}`,
    });

    res.json({
      success: true,
    });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

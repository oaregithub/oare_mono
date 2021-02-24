import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import {
  CommentDisplay,
  Thread,
  ThreadWithComments,
  Comment,
  ThreadStatus,
  ThreadDisplay,
  UpdateThreadNameRequest,
} from '@oare/types';
import authenticatedRoute from '@/middlewares/authenticatedRoute';
import adminRoute from '@/middlewares/adminRoute';

const router = express.Router();

router
  .route('/threads/:referenceUuid')
  .get(authenticatedRoute, async (req, res, next) => {
    try {
      const { referenceUuid } = req.params;
      const threadsDao = sl.get('ThreadsDao');
      const commentsDao = sl.get('CommentsDao');
      const userDao = sl.get('UserDao');

      const threads: Thread[] = await threadsDao.getByReferenceUuid(
        referenceUuid
      );
      let results: ThreadWithComments[] = [];

      const getUsersByComments = async (
        comments: Comment[]
      ): Promise<CommentDisplay[]> =>
        Promise.all(
          comments.map(async (comment: Comment) => {
            const user = await userDao.getUserByUuid(comment.userUuid);

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
          })
        );

      results = await Promise.all(
        threads.map(async thread => {
          const comments = await commentsDao.getAllByThreadUuid(
            thread.uuid || ''
          );
          const commentDisplays = await getUsersByComments(comments);
          return {
            thread,
            comments: commentDisplays,
          };
        })
      );

      res.json(results);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router.route('/threads').put(adminRoute, async (req, res, next) => {
  try {
    const thread: Thread = req.body;
    const threadsDao = sl.get('ThreadsDao');
    const commentsDao = sl.get('CommentsDao');

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

    res.status(200).end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router
  .route('/threads/user/:userUuid')
  .get(authenticatedRoute, async (req, res, next) => {
    try {
      const { userUuid } = req.params;
      const threadsDao = sl.get('ThreadsDao');
      const commentsDao = sl.get('CommentsDao');

      const comments = await commentsDao.getAllByUserUuidGroupedByThread(
        userUuid
      );

      const results: ThreadDisplay[] = await Promise.all(
        comments.map(async comment => {
          const thread = await threadsDao.getByUuid(comment.threadUuid);
          const threadWord = await threadsDao.getThreadWord(comment.threadUuid);

          if (thread === null || threadWord === null) {
            throw new HttpInternalError(
              'Unable to retrieve thread for specific user'
            );
          }
          return {
            uuid: thread.uuid,
            word: threadWord,
            status: thread.status,
            route: thread.route,
            latestComment: comment.text,
          } as ThreadDisplay;
        })
      );

      res.json(results);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/threads/name')
  .put(authenticatedRoute, async (req, res, next) => {
    try {
      const { threadUuid, newName }: UpdateThreadNameRequest = req.body;
      const threadsDao = sl.get('ThreadsDao');

      await threadsDao.updateThreadName(threadUuid, newName);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;

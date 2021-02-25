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

      // All the threads the user is associated with (in comment form)
      const comments = await commentsDao.getAllByUserUuidGroupedByThread(
        userUuid,
        true
      );

      const results: ThreadDisplay[] = await Promise.all(
        comments.map(async comment => {
          const thread = await threadsDao.getByUuid(comment.threadUuid);
          const threadWord = await threadsDao.getThreadWord(comment.threadUuid);
          const threadComments = await commentsDao.getAllByThreadUuid(
            comment.threadUuid,
            true
          );

          if (thread === null || threadWord === null) {
            throw new HttpInternalError(
              'Unable to retrieve thread for specific user'
            );
          }
          return {
            thread,
            word: threadWord,
            latestCommentDate: threadComments[0].createdAt, // Most recent comment
            comments: threadComments,
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

router.route('/threads').get(adminRoute, async (req, res, next) => {
  try {
    const threadsDao = sl.get('ThreadsDao');
    const commentsDao = sl.get('CommentsDao');

    const threads = await threadsDao.getAll();

    const results: ThreadDisplay[] = await Promise.all(
      threads.map(async thread => {
        const threadWord = await threadsDao.getThreadWord(thread.uuid || '');
        const comments = await commentsDao.getAllByThreadUuid(
          thread.uuid || '',
          true
        );
        return {
          thread,
          word: threadWord,
          latestCommentDate: comments[0].createdAt,
          comments,
        } as ThreadDisplay;
      })
    );

    const sortByLatestComment = (a: ThreadDisplay, b: ThreadDisplay) => {
      if (a.latestCommentDate < b.latestCommentDate) {
        return 1;
      } else if (b.latestCommentDate < a.latestCommentDate) {
        return -1;
      } else {
        return 0;
      }
    };

    results.sort(sortByLatestComment);

    res.json(results);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

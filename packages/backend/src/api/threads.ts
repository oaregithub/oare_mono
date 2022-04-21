import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import {
  CommentDisplay,
  Thread,
  ThreadWithComments,
  Comment,
  ThreadDisplay,
  UpdateThreadNameRequest,
  AllCommentsRequest,
  AllCommentsResponse,
  CreateThreadPayload,
  ThreadStatus,
  CommentSortType,
} from '@oare/types';
import authenticatedRoute from '@/middlewares/authenticatedRoute';
import adminRoute from '@/middlewares/adminRoute';
import { toInteger } from 'lodash';

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
              userUuid: comment.userUuid,
              userFirstName: user.firstName,
              userLastName: user.lastName,
              createdAt: new Date(comment.createdAt),
              deleted: comment.deleted,
              text: comment.text,
            } as CommentDisplay;
          })
        );

      results = await Promise.all(
        threads.map(async thread => {
          const comments = await commentsDao.getAllByThreadUuid(thread.uuid);
          const commentDisplays = await getUsersByComments(comments);
          return {
            ...thread,
            comments: commentDisplays,
          };
        })
      );

      res.json(results);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/threads').put(adminRoute, async (req, res, next) => {
  try {
    const thread: Thread = req.body;
    const threadsDao = sl.get('ThreadsDao');
    const commentsDao = sl.get('CommentsDao');

    const prevThread = await threadsDao.getByUuid(thread.uuid);
    if (prevThread === null) {
      throw new HttpInternalError('Previous Thread was not found');
    }

    await threadsDao.update(thread);

    await commentsDao.insert(req.user!.uuid, {
      threadUuid: thread.uuid,
      text: `The status was changed from ${prevThread.status} to ${thread.status}`,
    });

    res.status(200).end();
  } catch (err) {
    next(new HttpInternalError(err as string));
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
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/threads')
  .get(authenticatedRoute, async (req, res, next) => {
    try {
      const {
        status,
        thread,
        item,
        comment,
        sortType,
        sortDesc,
        page,
        limit,
        filter,
        isUserComments,
      } = req.query;

      const threadsDao = sl.get('ThreadsDao');
      const commentsDao = sl.get('CommentsDao');

      const request: AllCommentsRequest = {
        filters: {
          status: status as ThreadStatus,
          thread: thread as string,
          item: item as string,
          comment: comment as string,
        },
        sort: {
          type: sortType as CommentSortType,
          desc: toInteger(sortDesc) === 1,
        },
        pagination: {
          page: toInteger(page),
          limit: toInteger(limit),
          filter: filter as string,
        },
        isUserComments: toInteger(isUserComments) === 1,
      };

      const userUuid = req.user ? req.user.uuid : null;

      const threadRows = await threadsDao.getAll(request, userUuid);

      const results: ThreadDisplay[] = await Promise.all(
        threadRows.threads.map(async threadRow => {
          const comments = await commentsDao.getAllByThreadUuid(
            threadRow.uuid,
            true
          );
          return {
            thread: {
              uuid: threadRow.uuid,
              name: threadRow.name,
              referenceUuid: threadRow.referenceUuid,
              status: threadRow.status,
              route: threadRow.route,
            },
            word: threadRow.item,
            latestCommentDate: new Date(threadRow.timestamp),
            comments,
          } as ThreadDisplay;
        })
      );

      res.json({
        threads: results,
        count: threadRows.count,
      } as AllCommentsResponse);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(authenticatedRoute, async (req, res, next) => {
    try {
      const ThreadsDao = sl.get('ThreadsDao');
      const newThread: CreateThreadPayload = req.body;

      const newThreadUuid = await ThreadsDao.insert(newThread);
      res.json(newThreadUuid);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/newthreads/').get(adminRoute, async (_req, res, next) => {
  try {
    const ThreadsDao = sl.get('ThreadsDao');

    const response = await ThreadsDao.newThreadsExist();
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

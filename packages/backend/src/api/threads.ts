import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { CommentDisplay, Thread, ThreadWithComments } from '@oare/types';

const router = express.Router();

router.route('/threads/:referenceUuid').get(async (req, res, next) => {
  try {
    const { referenceUuid } = req.params;
    const threadsDao = sl.get('ThreadsDao');
    const commentsDao = sl.get('CommentsDao');
    const userDao = sl.get('UserDao');

    const threads: Thread[] | null = await threadsDao.getByReferenceUuid(referenceUuid);
    const results: ThreadWithComments[] = [];
    let commentDisplays: CommentDisplay[] = [];

    if (threads) {
      for (let i = 0; i < threads.length; i += 1) {
        const threadUuid = threads[i].uuid;
        if (threadUuid) {
          const comments = await commentsDao.getAllByThreadUuid(threadUuid);
          commentDisplays = [];
          for (let j = 0; j < comments.length; j += 1) {
            const user = await userDao.getUserByUuid(comments[j].userUuid);
            commentDisplays.push({
              uuid: comments[j].uuid,
              threadUuid: comments[j].threadUuid,
              userUuid: comments[j].userUuid,
              userFirstName: user ? user.firstName : '',
              userLastName: user ? user.lastName : '',
              createdAt: new Date(comments[j].createdAt),
              deleted: comments[j].deleted,
              text: comments[j].text,
            });
          }
          results.push({
            thread: threads[i],
            comments: commentDisplays,
          });
        }
      }
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

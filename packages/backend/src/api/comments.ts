import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { Thread } from '@oare/types';

const router = express.Router();

router.route('/comments').post(async (req, res, next) => {
  try {
    const { comment, thread } = req.body;
    const commentsDao = sl.get('CommentsDao');
    const threadsDao = sl.get('ThreadsDao');

    // Check if thread already exists.
    let foundThreads: Thread[] = await threadsDao.getByReferenceUuid(thread.referenceUuid);

    if (!foundThreads.length) {
      // Create new thread.
      await threadsDao.insert(thread);
      foundThreads = await threadsDao.getByReferenceUuid(thread.referenceUuid);
    }

    comment.threadUuid = foundThreads[0].uuid;
    // MySQL datetime format.
    comment.createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Insert comment.
    await commentsDao.insert(comment);

    res.json({
      success: true,
    });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

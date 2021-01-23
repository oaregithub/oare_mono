import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { CommentRequest, CommentResponse, Thread } from '@oare/types';

const router = express.Router();

router.route('/comments').post(async (req, res, next) => {
  try {
    const { comment, thread }: CommentRequest = req.body;
    const commentsDao = sl.get('CommentsDao');
    const threadsDao = sl.get('ThreadsDao');

    // Check if thread already exists.
    const foundThread: Thread | null = await threadsDao.getByReferenceUuid(thread.referenceUuid);

    if (!foundThread) {
      // Create new thread.
      comment.threadUuid = await threadsDao.insert(thread);
    } else {
      comment.threadUuid = foundThread.uuid;
    }

    // MySQL datetime format.
    comment.createdAt = new Date();

    // Insert comment.
    const newCommentUuid = await commentsDao.insert(comment);

    res.json({
      commentUuid: newCommentUuid,
      threadUuid: comment.threadUuid,
    } as CommentResponse);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

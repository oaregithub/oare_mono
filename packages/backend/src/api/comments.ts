import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { CommentRequest, CommentResponse, Thread } from '@oare/types';
import authenticatedRoute from '@/middlewares/authenticatedRoute';

const router = express.Router();

router.route('/comments').post(authenticatedRoute, async (req, res, next) => {
  try {
    const { comment, thread }: CommentRequest = req.body;
    const commentsDao = sl.get('CommentsDao');
    const threadsDao = sl.get('ThreadsDao');

    // Check if thread already exists.

    if (!thread.uuid) {
      // Create new thread.
      comment.threadUuid = await threadsDao.insert(thread);
    } else {
      comment.threadUuid = thread.uuid;
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

router.route('/comments/:uuid').delete(authenticatedRoute, async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const commentsDao = sl.get('CommentsDao');
    await commentsDao.updateDelete(uuid);

    res.json({
      success: true,
    });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { CreateCommentPayload } from '@oare/types';
import authenticatedRoute from '@/middlewares/authenticatedRoute';

const router = express.Router();

router.route('/comments').post(authenticatedRoute, async (req, res, next) => {
  try {
    const comment: CreateCommentPayload = req.body;
    const commentsDao = sl.get('CommentsDao');

    // Insert comment.
    const newCommentUuid = await commentsDao.insert(req.user!.uuid, comment);

    res.status(201).json(newCommentUuid);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router
  .route('/comments/:uuid')
  .delete(authenticatedRoute, async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const commentsDao = sl.get('CommentsDao');
      await commentsDao.updateDelete(uuid);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;

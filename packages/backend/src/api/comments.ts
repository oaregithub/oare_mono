import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { CreateCommentPayload } from '@oare/types';
import permissionRoute from '@/middlewares/router/permissionsRoute';

const router = express.Router();

router
  .route('/comments')
  .post(permissionRoute('ADD_COMMENTS'), async (req, res, next) => {
    try {
      const comment: CreateCommentPayload = req.body;
      const commentsDao = sl.get('CommentsDao');

      // Insert comment.
      const newCommentUuid = await commentsDao.insert(req.user!.uuid, comment);

      res.status(201).json(newCommentUuid);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/comments/:uuid')
  .delete(permissionRoute('ADD_COMMENTS'), async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const commentsDao = sl.get('CommentsDao');
      await commentsDao.updateDelete(uuid);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;

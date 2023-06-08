import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import permissionRoute from '@/middlewares/router/permissionsRoute';
import { CreateCommentPayload } from '@oare/types';

// COMPLETED

const router = express.Router();

router
  .route('/comments')
  .post(permissionRoute('ADD_COMMENTS'), async (req, res, next) => {
    try {
      const CommentsDao = sl.get('CommentsDao');

      const { threadUuid, comment }: CreateCommentPayload = req.body;

      await CommentsDao.createComment(threadUuid, req.user!.uuid, comment);

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/comments/:uuid')
  .delete(permissionRoute('ADD_COMMENTS'), async (req, res, next) => {
    try {
      const CommentsDao = sl.get('CommentsDao');

      const { uuid } = req.params;

      await CommentsDao.markAsDeleted(uuid);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;

import express from 'express';
import sl from '@/serviceLocator';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import permissionRoute from '@/middlewares/router/permissionsRoute';
import { CreateCommentPayload } from '@oare/types';

const router = express.Router();

router
  .route('/comments')
  .post(permissionRoute('ADD_COMMENTS'), async (req, res, next) => {
    try {
      const CommentsDao = sl.get('CommentsDao');
      const ThreadsDao = sl.get('ThreadsDao');

      const { threadUuid, comment }: CreateCommentPayload = req.body;

      const threadExists = await ThreadsDao.threadExists(threadUuid);
      if (!threadExists) {
        next(new HttpBadRequest('Thread does not exist'));
        return;
      }

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

      const commentExists = await CommentsDao.commentExists(uuid);
      if (!commentExists) {
        next(new HttpBadRequest('Comment does not exist'));
        return;
      }

      await CommentsDao.markAsDeleted(uuid);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;

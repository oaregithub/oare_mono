import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';

const router = express.Router();

router
  .route(routeName)
  .get(async (req, res, next) => {
    try {
      const PageContentDao = sl.get('PageContentDao');
      const content = await PageContentDao.getContent(routeName);
      return content;
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const PageContentDao = sl.get('PageContentDao');
      await PageContentDao.editContent(routeName, newContent);
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

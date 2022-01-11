import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';

const router = express.Router();

router
  .route('/page_content/:routeName')
  .get(async (req, res, next) => {
    try {
      const { routeName } = req.params;
      const PageContentDao = sl.get('PageContentDao');
      const content = await PageContentDao.getContent(routeName);
      res.json(content);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const { routeName } = req.params;
      const { content } = req.body;
      const PageContentDao = sl.get('PageContentDao');
      await PageContentDao.editContent(routeName, content);
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

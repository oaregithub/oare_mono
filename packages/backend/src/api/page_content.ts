import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/router/adminRoute';
import cacheMiddleware from '@/middlewares/router/cache';

// COMPLETE

const router = express.Router();

router
  .route('/page_content/:name')
  .get(cacheMiddleware<string>(null), async (req, res, next) => {
    try {
      const PageContentDao = sl.get('PageContentDao');
      const cache = sl.get('cache');

      const { name } = req.params;

      const content = await PageContentDao.getContent(name);

      const response = await cache.insert<string>({ req }, content, null);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const PageContentDao = sl.get('PageContentDao');
      const cache = sl.get('cache');

      const { name } = req.params;
      const { content } = req.body;

      await PageContentDao.editContent(name, content);

      await cache.clear(`/page_content/${name}`, {
        level: 'exact',
      });

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;

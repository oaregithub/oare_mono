import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/router/adminRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import { noFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/page_content/:routeName')
  .get(cacheMiddleware<string>(noFilter), async (req, res, next) => {
    try {
      const { routeName } = req.params;
      const PageContentDao = sl.get('PageContentDao');
      const cache = sl.get('cache');
      const content = await PageContentDao.getContent(routeName);

      const response = await cache.insert<string>({ req }, content, noFilter);
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const { routeName } = req.params;
      const { content } = req.body;
      const PageContentDao = sl.get('PageContentDao');
      const cache = sl.get('cache');
      await PageContentDao.editContent(routeName, content);
      await cache.clear(
        `/page_content/${routeName}`,
        {
          level: 'exact',
        },
        req
      );
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;

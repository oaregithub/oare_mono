import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';
import { API_PATH } from '@/setupRoutes';

const router = express.Router();

router
  .route('/page_content/:routeName')
  .get(async (req, res, next) => {
    try {
      const { routeName } = req.params;
      const PageContentDao = sl.get('PageContentDao');
      const cache = sl.get('cache');
      const content = await PageContentDao.getContent(routeName);
      cache.insert({ req }, content);
      res.json(content);
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
      cache.clear(
        {
          req: {
            originalUrl: `${API_PATH}/page_content`,
            method: 'GET',
          },
        },
        { exact: false }
      );
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;

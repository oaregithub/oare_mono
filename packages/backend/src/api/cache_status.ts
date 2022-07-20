import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/adminRoute';
import authenticatedRoute from '@/middlewares/authenticatedRoute';

const router = express.Router();

router.route('/cache').get(async (_req, res, next) => {
  try {
    const CacheStatusDao = sl.get('CacheStatusDao');
    const isEnabled = await CacheStatusDao.cacheIsEnabled();
    res.json(isEnabled);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/cache/enable').patch(adminRoute, async (_req, res, next) => {
  try {
    const CacheStatusDao = sl.get('CacheStatusDao');
    await CacheStatusDao.enableCache();
    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/cache/disable').patch(adminRoute, async (_req, res, next) => {
  try {
    const CacheStatusDao = sl.get('CacheStatusDao');
    await CacheStatusDao.disableCache();
    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/cache/flush').delete(adminRoute, async (req, res, next) => {
  try {
    const cache = sl.get('cache');
    const { propogate } = (req.query as unknown) as {
      propogate: 'true' | 'false';
    };

    await cache.flush(req, propogate === 'true');
    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/cache/clear')
  .delete(authenticatedRoute, async (req, res, next) => {
    try {
      const cache = sl.get('cache');
      const { url, level, propogate } = (req.query as unknown) as {
        url: string;
        level: 'exact' | 'startsWith';
        propogate: 'true' | 'false';
      };

      await cache.clear(url, { level }, req, propogate === 'true');

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/cache/keys').get(adminRoute, async (req, res, next) => {
  try {
    const cache = sl.get('cache');
    const { url, level, propogate } = (req.query as unknown) as {
      url: string;
      level: 'exact' | 'startsWith';
      propogate: 'true' | 'false';
    };
    const numKeys = await cache.keys(url, level, req, propogate === 'true');
    res.json(numKeys);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

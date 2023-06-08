import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';

// COMPLETE

const router = express.Router();

router.route('/cache_status').get(adminRoute, async (_req, res, next) => {
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

router.route('/cache/flush').delete(adminRoute, async (_req, res, next) => {
  try {
    const cache = sl.get('cache');

    await cache.flush();

    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/cache/clear').delete(adminRoute, async (req, res, next) => {
  try {
    const cache = sl.get('cache');

    const { url, level } = (req.query as unknown) as {
      url: string;
      level: 'exact' | 'startsWith';
    };

    await cache.clear(url, { level });

    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/cache/keys').get(adminRoute, async (req, res, next) => {
  try {
    const cache = sl.get('cache');

    const { url, level } = (req.query as unknown) as {
      url: string;
      level: 'exact' | 'startsWith';
    };

    const numKeys = await cache.keys(url, level);

    res.json(numKeys);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

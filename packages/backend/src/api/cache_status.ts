import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/adminRoute';

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

router.route('/cache/flush').delete(adminRoute, async (_req, res, next) => {
  try {
    const cache = sl.get('cache');
    await cache.flush();
    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

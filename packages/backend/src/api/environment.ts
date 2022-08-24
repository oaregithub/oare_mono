import express from 'express';
import { HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';
import { EnvironmentInfo } from '@oare/types';
import { getGoogleAnalyticsInfo } from '@/utils';

const router = express.Router();

router.route('/environment_info').get(adminRoute, async (_req, res, next) => {
  try {
    const environmentInfo: EnvironmentInfo = {
      elasticBeanstalkRegion: process.env.CURRENT_EB_REGION,
      databaseReadRegion: process.env.DB_READ_REGION,
      databaseWriteRegion: process.env.DB_WRITE_REGION,
    };
    res.json(environmentInfo);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/analytics_info').get(adminRoute, async (_req, res, next) => {
  try {
    const analyticsInfo = await getGoogleAnalyticsInfo();
    res.json(analyticsInfo);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

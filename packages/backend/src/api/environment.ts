import express from 'express';
import { HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';
import { EnvironmentInfo } from '@oare/types';

const router = express.Router();

router.route('/environment_info').get(adminRoute, async (_req, res, next) => {
  try {
    const environmentInfo: EnvironmentInfo = {
      elasticBeanstalkRegion: process.env.CURRENT_EB_REGION,
      databaseReadRegion: 'Coming Soon',
      databaseWriteRegion: 'Coming Soon',
    };
    res.json(environmentInfo);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

import express from 'express';
import { HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';
import { EnvironmentInfo } from '@oare/types';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/environment_info').get(adminRoute, async (_req, res, next) => {
  try {
    const utils = sl.get('utils');
    const environmentInfo: EnvironmentInfo = {
      elasticBeanstalkRegion: utils.getElasticBeanstalkRegion(),
      databaseReadRegion: utils.getDatabaseReadRegion(),
      databaseWriteRegion: utils.getDatabaseWriteRegion(),
      databaseReadOnly: process.env.DB_SOURCE === 'readonly',
    };
    res.json(environmentInfo);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/environment_readonly').get(async (_req, res, next) => {
  try {
    const databaseReadOnly = process.env.DB_SOURCE === 'readonly';
    res.json(databaseReadOnly);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

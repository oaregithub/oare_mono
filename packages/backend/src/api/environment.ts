import express from 'express';
import { HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/router/adminRoute';
import { EnvironmentInfo } from '@oare/types';

const router = express.Router();

// VERIFIED COMPLETE

router.route('/environment_info').get(adminRoute, async (_req, res, next) => {
  try {
    const elasticBeanstalkRegion = (() => {
      if (process.env.NODE_ENV === 'production') {
        return (
          process.env.CURRENT_EB_REGION ||
          'Unknown Production Region (No Environment Variable Set)'
        );
      }
      return 'Development (localhost)';
    })();

    const databaseReadRegion = (() => {
      if (process.env.NODE_ENV === 'production') {
        return (
          process.env.DB_READ_REGION ||
          'Unknown Production Read Region (No Environment Variable Set)'
        );
      }
      if (process.env.DB_SOURCE === 'readonly') {
        return 'Read-Only Production (us-west-2)';
      }
      return 'Development (Docker)';
    })();

    const databaseWriteRegion = (() => {
      if (process.env.NODE_ENV === 'production') {
        return (
          process.env.DB_WRITE_REGION ||
          'Unknown Production Write Region (No Environment Variable Set)'
        );
      }
      if (process.env.DB_SOURCE === 'readonly') {
        return 'Write Access Restricted';
      }
      return 'Development (Docker)';
    })();

    const databaseReadOnly = process.env.DB_SOURCE === 'readonly';

    const environmentInfo: EnvironmentInfo = {
      elasticBeanstalkRegion,
      databaseReadRegion,
      databaseWriteRegion,
      databaseReadOnly,
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

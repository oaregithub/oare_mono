import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

// MOSTLY COMPLETE

const router = express.Router();

// FIXME needs to be cached. A cache filter should be used to filter texts that the user cannot see.

router.route('/publications').get(async (_req, res, next) => {
  try {
    const PublicationDao = sl.get('PublicationDao');

    const prefixes = await PublicationDao.getAllPublicationPrefixes();

    const publications = await Promise.all(
      prefixes.map(prefix => PublicationDao.getPublicationByPrefix(prefix))
    );

    res.json(publications);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

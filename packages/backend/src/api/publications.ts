import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/publications').get(async (req, res, next) => {
  try {
    const userUuid = req.user ? req.user.uuid : null;
    const PublicationDao = sl.get('PublicationDao');

    const publicationPrefixes = await PublicationDao.getAllPublications();

    const publications = await Promise.all(
      publicationPrefixes.map(prefix =>
        PublicationDao.getPublicationsByPrfx(prefix, userUuid)
      )
    );

    res.json(publications);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

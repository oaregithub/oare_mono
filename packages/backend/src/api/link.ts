import express from 'express';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/link/:uuid')
  .get(async (req, res, next) => {
    try {
        const resourceDao = sl.get('ResourceDao');
        const signedLinks = await resourceDao.getTextLinksByTextUuid(req.params.uuid)
        // TODO: parse the signedLinks

    } catch (err) {
      next(new HttpInternalError(err));
    }
});
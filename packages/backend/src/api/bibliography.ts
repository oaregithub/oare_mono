import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';

const router = express.Router();

router.route('/bibliography/query').get(async (req, res, next) => {
  try {
    const pagination = (req.query.pagination || 25) as number;
    const BibliographyDao = sl.get('BibliographyDao');
    const rows = await BibliographyDao.queryAllRows(); // TODO: pagination

    rows.forEach(async row => {
      await BibliographyDao.queryZotero(
        row.zot_item_key,
        'chicago-author-date'
      );
    });
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/bibliography/style').get(async (req, res, next) => {
  const style = req.query.style || 'chicago-author-date';
});

export default router;

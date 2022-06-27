import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { extractPagination } from '@/utils';

const router = express.Router();

router.route('/bibliography/query').get(async (req, res, next) => {
  try {
    const { filter: search, limit: rows, page } = extractPagination(req.query, {
      defaultLimit: 25,
    });
    const BibliographyDao = sl.get('BibliographyDao');
    const ResourceDao = sl.get('ResourceDao');

    const bibliographies = await BibliographyDao.queryBibliographyPage(
      'chicago-author-date',
      { rows, page }
    );

    const objUuids: string[] = [];

    const fileURL = await ResourceDao.getFileURLByUuid(objUuids);

    const response = { bibliographies: bibliographies, fileURL: fileURL };

    res.json(bibliographies);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/bibliography/style').get(async (req, res, next) => {
  const style = (req.query.style || 'chicago-author-date') as string;
  const BibliographyDao = sl.get('BibliographyDao');
  //const resp = await BibliographyDao.queryAllRows(style); // TODO: pagination
});

export default router;

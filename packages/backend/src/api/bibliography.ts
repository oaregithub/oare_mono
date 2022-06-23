import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { extractPagination } from '@/utils';

const router = express.Router();

router.route('/bibliography/query').get(async (req, res, next) => {
  try {
    const { filter: search, limit: rows, page } = extractPagination(req.query);
    const BibliographyDao = sl.get('BibliographyDao');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const ResourceDao = sl.get('ResourceDao');

    const bibliographies = await BibliographyDao.queryBibliographyPage(
      'chicago-author-date',
      { rows, page }
    );

    /*
    const objUuids = await ItemPropertiesDao.getVariableObjectByReference(
      textUuid,
      'b3938276-173b-11ec-8b77-024de1c1cc1d'
    );
    */

    //const fileURL = await ResourceDao.getFileURLByUuid(objUuids);

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

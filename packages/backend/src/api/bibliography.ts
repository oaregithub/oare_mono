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
    const BibliographyUtils = sl.get('BibliographyUtils');
    const ResourceDao = sl.get('ResourceDao');
    const citationStyle = 'chicago-author-date';

    const bibliographies = await BibliographyDao.queryBibliographyByPage({
      page,
      rows,
    });

    const zoteroResponse = await BibliographyUtils.fetchZotero(
      bibliographies,
      citationStyle
    );

    const objUuids = bibliographies.map(item => item.uuid);

    const fileURL = await ResourceDao.getFileURLByUuid(objUuids);

    const bibs = zoteroResponse.map(item => item.bib);

    const datas = zoteroResponse.map(item => item.data);

    const response = { bibs, datas, fileURL };

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/bibliography/style').get(async (req, res, next) => {
  try {
    const { filter: search, limit: rows, page } = extractPagination(req.query, {
      defaultLimit: 25,
    });
    const BibliographyDao = sl.get('BibliographyDao');
    const BibliographyUtils = sl.get('BibliographyUtils');
    const ResourceDao = sl.get('ResourceDao');
    const citationStyle = (req.query.style || 'chicago-author-date') as string;

    const bibliographies = await BibliographyDao.queryBibliographyByPage({
      page,
      rows,
    });

    const zoteroResponse = await BibliographyUtils.fetchZotero(
      bibliographies,
      citationStyle
    );

    const objUuids = bibliographies.map(item => item.uuid);

    const fileURL = await ResourceDao.getFileURLByUuid(objUuids);

    const bibs = zoteroResponse.map(item => item.bib);

    const datas = zoteroResponse.map(item => item.data);

    const response = { bibs, datas, fileURL };

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { extractPagination } from '@/utils';
import { fetchZotero } from './daos/BibliographyDao/utils';

const router = express.Router();

router.route('/bibliography/query').get(async (req, res, next) => {
  try {
    const { filter: search, limit: rows, page } = extractPagination(req.query, {
      defaultLimit: 25,
    });
    const BibliographyDao = sl.get('BibliographyDao');
    const ResourceDao = sl.get('ResourceDao');
    const citationStyle = 'chicago-author-date';

    const bibliographies = await BibliographyDao.queryBibliographyByPage({
      page: page,
      rows: rows,
    });

    const zoteroResponse = await fetchZotero(bibliographies, citationStyle);

    const objUuids = bibliographies.map(item => item.uuid);

    const fileURL = await ResourceDao.getFileURLByUuid(objUuids);

    const bibs = zoteroResponse.map(item => item.bib);

    const datas = zoteroResponse.map(item => item.data);

    const response = { bib: bibs, data: datas, fileURL: fileURL };

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
    const ResourceDao = sl.get('ResourceDao');
    const citationStyle = (req.query.style || 'chicago-author-date') as string;

    const bibliographies = await BibliographyDao.queryBibliographyByPage({
      page: page,
      rows: rows,
    });

    const zoteroResponse = await fetchZotero(bibliographies, citationStyle);

    const objUuids = bibliographies.map(item => item.uuid);

    const fileURL = await ResourceDao.getFileURLByUuid(objUuids);

    const bibs = zoteroResponse.map(item => item.bib);

    const datas = zoteroResponse.map(item => item.data);

    const response = { bib: bibs, data: datas, fileURL: fileURL };

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;

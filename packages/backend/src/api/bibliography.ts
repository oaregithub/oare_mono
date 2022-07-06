import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { extractPagination } from '@/utils';
import { BibliographyResponse } from '@oare/types';
import permissionsRoute from '@/middlewares/permissionsRoute';

const router = express.Router();

router
  .route('/bibliographies')
  .get(permissionsRoute('VIEW_BIBLIOGRAPHY'), async (req, res, next) => {
    try {
      const { filter: search, limit: rows, page } = extractPagination(
        req.query,
        {
          defaultLimit: 25,
        }
      );
      const BibliographyDao = sl.get('BibliographyDao');
      const BibliographyUtils = sl.get('BibliographyUtils');
      const ResourceDao = sl.get('ResourceDao');
      const citationStyle = (req.query.style ||
        'chicago-author-date') as string;

      const bibliographies = await BibliographyDao.getBiblographies({
        page,
        rows,
      });

      const zoteroResponse = await BibliographyUtils.fetchZotero(
        bibliographies,
        citationStyle
      );

      const objUuids = bibliographies.map(item => item.uuid);

      const fileURL = await ResourceDao.getFileURLByUuid(objUuids);

      const response: BibliographyResponse[] = zoteroResponse.map(
        (item, index) =>
          ({
            bib: item.bib,
            data: item.data,
            url: fileURL[index],
          } as BibliographyResponse)
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;

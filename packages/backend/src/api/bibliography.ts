import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { extractPagination } from '@/utils';
import { BibliographyResponse } from '@oare/types';
import permissionsRoute from '@/middlewares/permissionsRoute';
import cacheMiddleware from '@/middlewares/cache';
import { noFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/bibliographies')
  .get(
    permissionsRoute('VIEW_BIBLIOGRAPHY'),
    cacheMiddleware<BibliographyResponse[]>(noFilter),
    async (req, res, next) => {
      try {
        const { limit: rows, page } = extractPagination(req.query, {
          defaultLimit: 25,
        });

        const BibliographyDao = sl.get('BibliographyDao');
        const BibliographyUtils = sl.get('BibliographyUtils');
        const ResourceDao = sl.get('ResourceDao');
        const cache = sl.get('cache');

        const citationStyle = (req.query.style ||
          'chicago-author-date') as string;

        const bibliographies = await BibliographyDao.getBibliographies({
          page,
          rows,
        });

        const zoteroResponse = await Promise.all(
          bibliographies.map(async bibliography =>
            BibliographyUtils.getZoteroReferences(bibliography, citationStyle, [
              'bib',
              'data',
            ])
          )
        );

        const fileURL = await Promise.all(
          bibliographies.map(async item =>
            ResourceDao.getPDFUrlByBibliographyUuid(item.uuid)
          )
        );

        const biblioResponse: BibliographyResponse[] = zoteroResponse.map(
          (item, index) =>
            ({
              bib: item ? item.bib : null,
              data: item ? item.data : null,
              url: fileURL[index],
            } as BibliographyResponse)
        );

        const response = await cache.insert<BibliographyResponse[]>(
          { req },
          biblioResponse,
          noFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;

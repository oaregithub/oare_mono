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
    permissionsRoute('BIBLIOGRAPHY'),
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

        const citationStyle = (req.query.citationStyle ||
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
          bibliographies.map(async item => {
            const { fileUrl } = await ResourceDao.getPDFUrlByBibliographyUuid(
              item.uuid
            );
            return fileUrl;
          })
        );

        const biblioResponse: BibliographyResponse[] = zoteroResponse.map(
          (zot, index) =>
            ({
              title: zot && zot.data && zot.data.title ? zot.data.title : null,
              authors:
                zot && zot.data && zot.data.creators
                  ? zot.data.creators
                      .filter(creator => creator.creatorType === 'author')
                      .map(
                        creator => `${creator.firstName} ${creator.lastName}`
                      )
                  : [],
              date: zot && zot.data && zot.data.date ? zot.data.date : null,
              bibliography: {
                bib: zot && zot.bib ? zot.bib : null,
                url: fileURL[index] ? fileURL[index] : null,
              },
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

router
  .route('/bibliographies_count')
  .get(permissionsRoute('BIBLIOGRAPHY'), async (req, res, next) => {
    try {
      const BibliographyDao = sl.get('BibliographyDao');
      const count = await BibliographyDao.getBibliographiesCount();
      res.json(count);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;

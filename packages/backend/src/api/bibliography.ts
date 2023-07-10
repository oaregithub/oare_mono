import express from 'express';
import sl from '@/serviceLocator';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { Bibliography } from '@oare/types';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import { bibliographiesFilter, bibliographyFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/bibliographies')
  .get(
    permissionsRoute('BIBLIOGRAPHY'),
    cacheMiddleware<Bibliography[]>(bibliographiesFilter),
    async (req, res, next) => {
      try {
        const BibliographyDao = sl.get('BibliographyDao');
        const cache = sl.get('cache');

        const citationStyle = (req.query.citationStyle ||
          'chicago-author-date') as string;

        const bibliographyUuids = await BibliographyDao.getAllBibliographyUuids();

        const bibliographies = await Promise.all(
          bibliographyUuids.map(uuid =>
            BibliographyDao.getBibliographyByUuid(uuid, citationStyle)
          )
        );

        const response = await cache.insert<Bibliography[]>(
          { req },
          bibliographies,
          bibliographiesFilter,
          60 * 60 * 24 * 30 * 6
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/bibliography/:uuid')
  .get(
    permissionsRoute('BIBLIOGRAPHY'),
    cacheMiddleware<Bibliography>(bibliographyFilter),
    async (req, res, next) => {
      try {
        const BibliographyDao = sl.get('BibliographyDao');
        const cache = sl.get('cache');

        const { uuid } = req.params;

        const citationStyle = req.query.citationStyle as string | undefined;
        if (!citationStyle) {
          next(new HttpBadRequest('Citation style not specified'));
          return;
        }

        const bibliographyExists = await BibliographyDao.bibliographyExists(
          uuid
        );
        if (!bibliographyExists) {
          next(new HttpBadRequest('Bibliography does not exist'));
          return;
        }

        const bibliography = await BibliographyDao.getBibliographyByUuid(
          uuid,
          citationStyle
        );

        const response = await cache.insert<Bibliography>(
          { req },
          bibliography,
          bibliographyFilter,
          60 * 60 * 24 * 30 * 6
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;

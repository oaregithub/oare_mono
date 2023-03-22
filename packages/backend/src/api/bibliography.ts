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
        const BibliographyDao = sl.get('BibliographyDao');
        const BibliographyUtils = sl.get('BibliographyUtils');
        const ResourceDao = sl.get('ResourceDao');
        const cache = sl.get('cache');

        const citationStyle = (req.query.citationStyle ||
          'chicago-author-date') as string;

        const bibliographies = await BibliographyDao.getBibliographies();
        const totalBibs = bibliographies.length;

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
              itemType:
                zot && zot.data && zot.data.itemType ? zot.data.itemType : null,
              uuid: bibliographies[index].uuid,
            } as BibliographyResponse)
        );

        const response = await cache.insert<BibliographyResponse[]>(
          { req },
          biblioResponse,
          noFilter,
          60 * 60 * 24 * 30 * 6
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

router
  .route('/bibliography/:uuid')
  .get(
    permissionsRoute('BIBLIOGRAPHY'),
    cacheMiddleware<BibliographyResponse>(noFilter),
    async (req, res, next) => {
      try {
        const uuid = req.params.uuid as string;
        const BibliographyDao = sl.get('BibliographyDao');
        const BibliographyUtils = sl.get('BibliographyUtils');
        const ResourceDao = sl.get('ResourceDao');
        const cache = sl.get('cache');

        const citationStyle = 'chicago-author-date';

        const bibliography = await BibliographyDao.getBibliographyByUuid(uuid);

        const zoteroResponse = await BibliographyUtils.getZoteroReferences(
          bibliography,
          citationStyle,
          ['bib', 'data']
        );
        const { fileUrl } = await ResourceDao.getPDFUrlByBibliographyUuid(
          bibliography.uuid
        );

        const biblioResponse: BibliographyResponse = {
          title:
            zoteroResponse && zoteroResponse.data && zoteroResponse.data.title
              ? zoteroResponse.data.title
              : null,
          authors:
            zoteroResponse &&
            zoteroResponse.data &&
            zoteroResponse.data.creators
              ? zoteroResponse.data.creators
                  .filter(creator => creator.creatorType === 'author')
                  .map(creator => `${creator.firstName} ${creator.lastName}`)
              : [],
          date:
            zoteroResponse && zoteroResponse.data && zoteroResponse.data.date
              ? zoteroResponse.data.date
              : null,
          bibliography: {
            bib:
              zoteroResponse && zoteroResponse.bib ? zoteroResponse.bib : null,
            url: fileUrl || null,
          },
          itemType:
            zoteroResponse &&
            zoteroResponse.data &&
            zoteroResponse.data.itemType
              ? zoteroResponse.data.itemType
              : null,
          uuid: bibliography.uuid,
        } as BibliographyResponse;

        const response = await cache.insert<BibliographyResponse>(
          { req },
          biblioResponse,
          noFilter,
          60 * 60 * 24 * 30 * 6
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;

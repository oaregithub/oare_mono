import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import {
  PersonCore,
  Person,
  TextOccurrencesCountResponseItem,
} from '@oare/types';
import { personFilter } from '@/cache/filters';

// COMPLETE

const router = express.Router();

router
  .route('/persons/:letter')
  .get(
    permissionsRoute('PERSONS'),
    cacheMiddleware<PersonCore[]>(null),
    async (req, res, next) => {
      try {
        const { letter } = req.params;
        const PersonDao = sl.get('PersonDao');
        const cache = sl.get('cache');

        const personUuidsByLetter = await PersonDao.getPersonUuidsByLetterGroup(
          letter
        );

        const personCores = await Promise.all(
          personUuidsByLetter.map(uuid => PersonDao.getPersonCoreByUuid(uuid))
        );

        const response = await cache.insert<PersonCore[]>(
          { req },
          personCores,
          null
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/persons/occurrences/count')
  .get(permissionsRoute('PERSONS'), async (req, res, next) => {
    try {
      const PersonDao = sl.get('PersonDao');
      const utils = sl.get('utils');

      const roleUuid = (req.query.roleUuid as string) || undefined;
      const personUuids = req.query.personsUuids as string[];
      const userUuid = req.user ? req.user.uuid : null;
      const { filter } = utils.extractPagination(req.query);

      const occurrences = await Promise.all(
        personUuids.map(uuid =>
          PersonDao.getPersonOccurrencesCount(
            uuid,
            userUuid,
            { filter },
            roleUuid
          )
        )
      );

      const response: TextOccurrencesCountResponseItem[] = personUuids.map(
        (uuid, idx) => ({
          uuid,
          count: occurrences[idx],
        })
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/persons/occurrences/texts')
  .get(permissionsRoute('PERSONS'), async (req, res, next) => {
    try {
      const utils = sl.get('utils');
      const PersonDao = sl.get('PersonDao');

      const roleUuid = (req.query.roleUuid as string) || undefined;
      const userUuid = req.user ? req.user.uuid : null;
      const pagination = utils.extractPagination(req.query);
      const personsUuids = req.query.personsUuids as string[];

      const rows = await PersonDao.getPersonOccurrencesTexts(
        personsUuids,
        userUuid,
        pagination,
        roleUuid
      );

      const response = await utils.getTextOccurrences(rows, req.locale);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/persons/disconnect/:personUuid/:discourseUuid')
  .delete(
    permissionsRoute('DISCONNECT_OCCURRENCES'),
    async (req, res, next) => {
      try {
        const ItemPropertiesDao = sl.get('ItemPropertiesDao');

        const { personUuid, discourseUuid } = req.params;

        await ItemPropertiesDao.deleteItemPropertyRowsByReferenceUuidAndObjectUuid(
          discourseUuid,
          personUuid
        );

        res.status(204).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/person/:uuid')
  .get(
    permissionsRoute('PERSONS'),
    cacheMiddleware<Person>(personFilter),
    async (req, res, next) => {
      try {
        const PersonDao = sl.get('PersonDao');
        const cache = sl.get('cache');

        const { uuid } = req.params;

        const person = await PersonDao.getPersonByUuid(uuid);

        const response = await cache.insert<Person>(
          {
            req,
          },
          person,
          personFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;

import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import {
  PersonRow,
  PersonListItem,
  ItemPropertyRow,
  TextOccurrencesCountResponseItem,
  PersonInfo,
} from '@oare/types';
import { personFilter } from '@/cache/filters';

// FIXME

const router = express.Router();

router
  .route('/persons/:letter')
  .get(
    permissionsRoute('PERSONS'),
    cacheMiddleware<PersonListItem[]>(null),
    async (req, res, next) => {
      try {
        const { letter } = req.params;
        const PersonDao = sl.get('PersonDao');
        const ItemPropertiesDao = sl.get('ItemPropertiesDao');
        const DictionaryWordDao = sl.get('DictionaryWordDao');
        const cache = sl.get('cache');

        const personRows: PersonRow[] = await PersonDao.getPersonsRowsByLetter(
          letter
        );

        const personProperties: ItemPropertyRow[][] = await Promise.all(
          personRows.map(({ uuid }) =>
            ItemPropertiesDao.getPropertiesByReferenceUuid(uuid)
          )
        );

        const displays: string[] = await Promise.all(
          personRows.map(async person => {
            if (person.nameUuid && person.relation && person.relationNameUuid) {
              const nameRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
                person.nameUuid
              );
              const relationNameRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
                person.relationNameUuid
              );
              if (!nameRow || !relationNameRow) {
                return person.label;
              }
              const name = nameRow.word;
              const relationName = relationNameRow.word;
              return `${name} ${person.relation} ${relationName}`;
            }
            return person.label;
          })
        );

        const personListItem: PersonListItem[] = personRows.map(
          (person, idx) => ({
            person,
            display: displays[idx],
            properties: personProperties[idx],
          })
        );

        const response = await cache.insert<PersonListItem[]>(
          { req },
          personListItem,
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
  .post(permissionsRoute('PERSONS'), async (req, res, next) => {
    try {
      const PersonDao = sl.get('PersonDao');
      const utils = sl.get('utils');

      const roleUuid = (req.query.roleUuid as string) || undefined;

      const personUuids: string[] = req.body;
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
        const PersonDao = sl.get('PersonDao');
        const { personUuid, discourseUuid } = req.params;

        await PersonDao.disconnectPerson(discourseUuid, personUuid);

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
    cacheMiddleware<PersonInfo>(personFilter),
    async (req, res, next) => {
      try {
        const PersonDao = sl.get('PersonDao');
        const cache = sl.get('cache');
        const { uuid } = req.params;
        const person = await PersonDao.getPersonInfo(uuid);
        const response = await cache.insert<PersonInfo>(
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

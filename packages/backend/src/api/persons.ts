import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import cacheMiddleware from '@/middlewares/cache';
import { PersonRow, PersonListItem, ItemPropertyRow } from '@oare/types';
import { personTextFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/persons/:letter')
  .get(
    permissionsRoute('PERSONS'),
    cacheMiddleware<PersonListItem[]>(personTextFilter),
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
                person.uuid
              );
              const relationNameRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
                person.relationNameUuid
              );
              if (!nameRow || !relationNameRow) {
                return person.label;
              }
              const name = nameRow.word;
              const relationName = nameRow.word;
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
            occurrences: null,
          })
        );

        const response = await cache.insert<PersonListItem[]>(
          { req },
          personListItem,
          personTextFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;

import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';

const router = express.Router();

router
  .route('/people/:letter')
  .get(permissionsRoute('PEOPLE'), async (req, res, next) => {
    try {
      const { letter } = req.params;
      const cache = sl.get('cache');
      const PersonDao = sl.get('PersonDao');
      const PersonTextOccurrencesDao = sl.get('PersonTextOccurrencesDao');

      const textCountByPersonUuid = await PersonTextOccurrencesDao.getAll();
      const people = await PersonDao.getAllPeople(letter);

      const resultPeople = people.map(person => {
        if (textCountByPersonUuid[person.uuid] !== undefined) {
          return {
            ...person,
            textOccurrenceCount: textCountByPersonUuid[person.uuid].count,
            textOccurrenceDistinctCount:
              textCountByPersonUuid[person.uuid].distinctCount,
          };
        }
        return {
          ...person,
          textOccurrenceCount: null,
          textOccurrenceDistinctCount: null,
        };
      });
      cache.insert({ req }, resultPeople);
      res.json(resultPeople);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/people/person/:uuid/texts')
  .get(permissionsRoute('PEOPLE'), async (req, res, next) => {
    try {
      const utils = sl.get('utils');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const { uuid } = req.params;
      const pagination = utils.extractPagination(req.query);

      const rows = await ItemPropertiesDao.getTextsOfPerson(uuid, pagination);

      const response = await utils.getTextOccurrences(rows);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;

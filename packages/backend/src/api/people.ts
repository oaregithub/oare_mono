import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import { GetAllPeopleRequest, Pagination } from '@oare/types';
import { extractPagination } from '@/utils';

const router = express.Router();

router
  .route('/people/:letter')
  .get(permissionsRoute('PEOPLE'), async (req, res, next) => {
    try {
      const pagination: Pagination = extractPagination(req.query);
      const { letter } = req.params;
      const cache = sl.get('cache');
      const PersonDao = sl.get('PersonDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');

      const people = await PersonDao.getAllPeople(letter, pagination);

      const spellingUuids = await Promise.all(
        people.map(person =>
          PersonDao.getSpellingUuidsByPerson(person.personNameUuid)
        )
      );

      const resultPeople = await Promise.all(
        people.map(async (person, index) => {
          const totalOccurrences = await Promise.all(
            spellingUuids[index].map(spellingUuid =>
              TextDiscourseDao.getTotalSpellingTexts(spellingUuid)
            )
          );

          return {
            ...person,
            totalReferenceCount: totalOccurrences.reduce(
              (sum, nextValue) => sum + nextValue,
              0
            ),
          };
        })
      );

      cache.insert({ req }, resultPeople);
      res.json(resultPeople);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/people/:letter/count')
  .get(permissionsRoute('PEOPLE'), async (req, res, next) => {
    try {
      const { letter } = req.params;
      const PersonDao = sl.get('PersonDao');

      const people = await PersonDao.getAllPeople(letter, null);

      res.json(people.length);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;

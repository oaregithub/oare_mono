import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import { GetAllPeopleRequest } from '@oare/types';

const router = express.Router();

router
  .route('/people')
  .get(permissionsRoute('PEOPLE'), async (req, res, next) => {
    try {
      const requestString = (req.query.request as unknown) as string;
      const request: GetAllPeopleRequest = JSON.parse(requestString);
      const cache = sl.get('cache');
      const PersonDao = sl.get('PersonDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');

      const people = await PersonDao.getAllPeople(
        request.letter,
        request.limit,
        request.offset
      );

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

export default router;

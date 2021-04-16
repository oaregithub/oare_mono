import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/people/:letter').get(async (req, res, next) => {
  try {
    const { letter } = req.params;
    // const cache = sl.get('cache');
    const PersonDao = sl.get('PersonDao');
    const people = await PersonDao.getAllPeople(letter.toLowerCase());

    const resultPeople = people.map(person => {
      return {
        ...person,
        totalReferenceCount: 1, // Temporary, will use getPersonReferences(personUuid: string) here.
      };
    });

    // cache.insert({ req }, dictionaryNames);
    res.json(resultPeople);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

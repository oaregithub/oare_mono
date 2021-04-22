import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';

const router = express.Router();

router.route('/people/:letter').get(async (req, res, next) => {
  try {
    const { letter } = req.params;
    // const cache = sl.get('cache');
    const PersonDao = sl.get('PersonDao');
    const people = await PersonDao.getAllPeople(letter.toLowerCase());

    console.log('Finished getting people');

    const spellingUuids = await Promise.all(
      people.map(person =>
        PersonDao.getSpellingUuidsByPerson(
          person.uuid //personNameUuid
        )
      )
    );

    console.log('Finished getting uuids');
    // console.log(spellingUuids); // Should be 2D array?

    const resultPeople = await Promise.all(
      people.map(async (person, index) => {
        const totalOccurrences = await Promise.all(
          spellingUuids[index].map(spellingUuid =>
            TextDiscourseDao.getTotalSpellingTexts(spellingUuid)
          )
        );
        // console.log('Got total occurrences for');
        // console.log(spellingUuids[index]);
        // console.log(totalOccurrences);
        return {
          ...person,
          totalReferenceCount: totalOccurrences,
        };
      })
    );

    console.log('Finished getting total occurrences');

    // const resultPeople = people.map(person => {
    //   return {
    //     ...person,
    //     totalReferenceCount: 1, // Temporary, will use getPersonReferences(personUuid: string) here.
    //   };
    // });

    // cache.insert({ req }, dictionaryNames);
    res.json(resultPeople);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

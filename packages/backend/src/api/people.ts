import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import { SpellingOccurrenceResponseRow } from '@oare/types';

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

      const resultPeople = people.map(person => ({
        ...person,
        textOccurrenceCount:
          textCountByPersonUuid[person.uuid] !== undefined
            ? textCountByPersonUuid[person.uuid]
            : null,
      }));
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

      const textOccurrences = await utils.getTextOccurrences(rows);

      const initialTextsOfPeople = await ItemPropertiesDao.getUniqueTextsOfPerson(
        uuid,
        pagination
      );

      // Label occurrences who's discourseUuid is not found in the text_epigraphy table (but should be)
      // (See last `innerJoin` of ItemPropertiesDao.getTextsOfPerson())
      const response = initialTextsOfPeople.map(textOfPerson => {
        const occurrences = textOccurrences.filter(
          textOccurrence =>
            textOccurrence.discourseUuid === textOfPerson.discourseUuid
        );

        if (occurrences.length > 0) {
          return occurrences[0];
        }
        return {
          discourseUuid: textOfPerson.discourseUuid,
          textName: textOfPerson.textName,
          textUuid: textOfPerson.textUuid,
          line: -1,
          wordOnTablet: -1,
          readings: ['<stong style="color: red">Not found</stong>'],
        } as SpellingOccurrenceResponseRow;
      });

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;

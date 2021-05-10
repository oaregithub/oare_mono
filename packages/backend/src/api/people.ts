import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import { PersonOccurrenceRow } from '@oare/types';

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
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const { uuid } = req.params;
      const pagination = utils.extractPagination(req.query);

      const uniqueReferenceUuids = await ItemPropertiesDao.getUniqueReferenceUuidOfPerson(
        uuid
      );
      const texts = await TextDiscourseDao.getPersonTextsByItemPropertyReferenceUuids(
        uniqueReferenceUuids,
        pagination
      );

      const phraseTexts = texts.filter(text => text.type === 'phrase');
      const otherTexts = texts.filter(text => text.type !== 'phrase');

      const allTexts: PersonOccurrenceRow[] = [...otherTexts];
      await Promise.all(
        phraseTexts.map(async text => {
          const wordTexts = await TextDiscourseDao.getWordsByPhraseUuid(
            text.discourseUuid,
            pagination
          );
          allTexts.push(...wordTexts);
        })
      );

      const textsWithEpigraphicUnits = await Promise.all(
        allTexts.map(async text => {
          const line = await TextDiscourseDao.getEpigraphicLineOfWord(
            text.discourseUuid
          );
          return {
            ...text,
            line,
          };
        })
      );

      // Sort alphabetic by textName.
      textsWithEpigraphicUnits.sort((a, b) => {
        if (a.textName.toLowerCase() < b.textName.toLowerCase()) {
          return -1;
        }
        if (a.textName.toLowerCase() > b.textName.toLowerCase()) {
          return 1;
        }
        return 0;
      });

      const paginatedTexts = utils.manualPagination(
        textsWithEpigraphicUnits,
        pagination
      );

      const textOccurrencesResponse = await utils.getTextOccurrences(
        paginatedTexts
      );

      // TODO: 2a - Make sure person_text_occurrences.count is correct (either DISTINCT texts or non-distinct) (update if necessary)
      // TODO: 2b - Make another column in person_text_occurrences (person_text_occurrences.distinct_count (if other column isn't distinct))

      res.json(textOccurrencesResponse);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;

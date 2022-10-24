import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import {
  PersonOccurrenceRow,
  PersonRow,
  PersonListItem,
  ItemPropertyRow,
} from '@oare/types';
import { PersonDetail } from 'aws-sdk/clients/rekognition';

const router = express.Router();

router
  .route('/people/:letter')
  .get(permissionsRoute('PEOPLE'), async (req, res, next) => {
    try {
      const { letter } = req.params;
      const PersonDao = sl.get('PersonDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');

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
          } else {
            return person.label;
          }
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

      res.json(personListItem);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/people/person/:uuid/occurrences')
  .get(permissionsRoute('PEOPLE'), async (req, res, next) => {
    try {
      const utils = sl.get('utils');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const { uuid } = req.params;
      const { filter } = utils.extractPagination(req.query);

      const uniqueReferenceUuids = await ItemPropertiesDao.getUniqueReferenceUuidOfPerson(
        uuid
      );
      const count = await TextDiscourseDao.getPersonTextsByItemPropertyReferenceUuidsCount(
        uniqueReferenceUuids,
        { filter }
      );

      res.json(count);
    } catch (err) {
      next(new HttpInternalError(err as string));
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

      const nonWordTexts = texts.filter(text => text.type !== 'word');
      const textsWithWords = texts.filter(text => text.type === 'word');

      const allTexts: Record<string, PersonOccurrenceRow> = {};

      textsWithWords.forEach((personText: PersonOccurrenceRow) => {
        if (allTexts[personText.discourseUuid] === undefined) {
          allTexts[personText.discourseUuid] = {
            ...personText,
            discoursesToHighlight: [personText.discourseUuid],
          };
        } else {
          allTexts[personText.discourseUuid].discoursesToHighlight.push(
            personText.discourseUuid
          );
        }
      });

      const reduceTexts = (
        rows: PersonOccurrenceRow[],
        rootDiscourseUuid: string
      ) => {
        rows.forEach((personText: PersonOccurrenceRow) => {
          if (allTexts[rootDiscourseUuid] === undefined) {
            allTexts[rootDiscourseUuid] = {
              ...personText,
              discourseUuid: rootDiscourseUuid,
              discoursesToHighlight: [personText.discourseUuid],
            };
          } else {
            allTexts[rootDiscourseUuid].discoursesToHighlight.push(
              personText.discourseUuid
            );
          }
        });
      };

      const getRemainingPhraseTexts = async (
        morePhraseText: PersonOccurrenceRow,
        rootDiscourseUuid: string
      ) => {
        const wordTexts = await TextDiscourseDao.getChildrenByParentUuid(
          morePhraseText.discourseUuid
        );

        const foundWordTexts = wordTexts.filter(
          wordText => wordText.type === 'word'
        );
        const foundNonWordTexts = wordTexts.filter(
          wordText => wordText.type !== 'word'
        );

        reduceTexts(foundWordTexts, rootDiscourseUuid);

        if (foundNonWordTexts.length > 0) {
          foundNonWordTexts.map(async foundNonWordText => {
            await getRemainingPhraseTexts(foundNonWordText, rootDiscourseUuid);
          });
        }
      };

      await Promise.all(
        nonWordTexts.map(async nonWordText => {
          await getRemainingPhraseTexts(nonWordText, nonWordText.discourseUuid);
        })
      );

      const reducedTexts: PersonOccurrenceRow[] = [...Object.values(allTexts)];

      const childToGetLineFrom = (row: PersonOccurrenceRow): string =>
        // Arbitrarily pick the first disourseUuid to retrieve the line number from.
        row.discoursesToHighlight[0];
      const textsWithEpigraphicUnits = await Promise.all(
        reducedTexts.map(async text => {
          const line = await TextDiscourseDao.getEpigraphicLineOfWord(
            childToGetLineFrom(text)
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

      const textOccurrencesResponse = await utils.getTextOccurrences(
        textsWithEpigraphicUnits,
        req.locale,
        true
      );

      res.json(textOccurrencesResponse);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;

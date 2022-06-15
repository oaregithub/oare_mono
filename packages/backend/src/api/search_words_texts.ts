import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import {
  WordsInTextSearchPayload,
  WordsInTextsSearchResponse,
  WordFormAutocompleteDisplay,
} from '@oare/types';

const router = express.Router();

router.route('/wordsAndForms').get(async (_req, res, next) => {
  try {
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const wordForms: WordFormAutocompleteDisplay[] = await DictionaryWordDao.getWordsAndFormsForWordsInTexts();
    res.json(wordForms);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/searchWordsInTexts').post(async (req, res, next) => {
  try {
    const {
      uuids,
      numWordsBetween,
      page,
      rows,
      sequenced,
      parseProperties,
    } = req.body;
    const payload: WordsInTextSearchPayload = {
      uuids: JSON.parse(uuids),
      parseProperties: JSON.parse(parseProperties),
      numWordsBetween: JSON.parse(numWordsBetween),
      page: Number(page),
      rows: Number(rows),
      sequenced: sequenced === 'true',
    };
    const userUuid: string | null = req.user ? req.user.uuid : null;
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const response: WordsInTextsSearchResponse = await TextDiscourseDao.wordsInTextsSearch(
      payload,
      userUuid
    );
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});
export default router;

import express from 'express';
import { HttpInternalError } from '@/exceptions';
import cache from '@/cache';
import sl from '@/serviceLocator';
import {
  WordsInTextSearchPayload,
  WordsInTextsSearchResponse,
  WordFormAutocompleteDisplay,
} from '@oare/types';

const router = express.Router();

router.route('/wordsAndForms').get(async (req, res, next) => {
  try {
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const results: WordFormAutocompleteDisplay[] = await DictionaryWordDao.getWordsAndFormsForWordsInTexts();
    cache.insert({ req }, results);
    res.json(results);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/searchWordsInTexts').post(async (req, res, next) => {
  try {
    const { uuids, numWordsBetween, page, rows, sequenced } = req.body;
    const payload: WordsInTextSearchPayload = {
      uuids: JSON.parse(uuids),
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
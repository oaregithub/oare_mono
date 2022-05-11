import express from 'express';
import { HttpInternalError } from '@/exceptions';
import cache from '@/cache';
import sl from '@/serviceLocator';
import {
  WordsInTextSearchPayload,
  Word,
  UuidPayload,
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

router.route('/searchWordsInTexts').get(async (req, res, next) => {
  try {
    const payload: WordsInTextSearchPayload = (req.query as unknown) as WordsInTextSearchPayload;
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

router.route('/formOptions').get(async (req, res, next) => {
  try {
    const DictionaryFormDao = sl.get('DictionaryFormDao');
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const { uuid } = (req.query as unknown) as UuidPayload;
    const isAdmin = req.user ? req.user.isAdmin : false;

    const wordUuid: string = await DictionaryWordDao.getWordUuidByWordOrFormUuid(
      uuid
    );
    const grammarInfo = await DictionaryWordDao.getGrammaticalInfo(wordUuid);
    const forms = await DictionaryFormDao.getWordForms(wordUuid, isAdmin, true);

    const result: Word = {
      ...grammarInfo,
      forms,
    };
    res.json(result);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});
export default router;

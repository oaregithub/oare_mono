import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import {
  WordsInTextSearchPayload,
  WordsInTextsSearchResponse,
  DictItemComboboxDisplay,
} from '@oare/types';

const router = express.Router();

router.route('/dictItems').get(async (_req, res, next) => {
  try {
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const results: DictItemComboboxDisplay[] = await DictionaryWordDao.getDictItemsForWordsInTexts();
    res.json(results);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/searchWordsInTexts').post(async (req, res, next) => {
  try {
    const { items, page, rows, sequenced, sortBy } = req.body;
    const payload: WordsInTextSearchPayload = {
      items: JSON.parse(items),
      page: Number(page),
      rows: Number(rows),
      sequenced: sequenced === 'true',
      sortBy,
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

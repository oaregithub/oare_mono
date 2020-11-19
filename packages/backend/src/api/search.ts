import express from 'express';
import { SearchTextsResponse, SearchTextsPayload, SearchSpellingPayload } from '@oare/types';
import cache from '@/cache';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

interface SearchDiscourseSpellingRow {
  line: number;
  textUuid: string;
  textName: string;
  textReading: string;
}
const router = express.Router();

router.route('/search/spellings/discourse').get(async (req, res, next) => {
  try {
    const textDiscourseDao = sl.get('TextDiscourseDao');
    const aliasDao = sl.get('AliasDao');

    const { spelling } = (req.query as unknown) as SearchSpellingPayload;

    const searchRows = await textDiscourseDao.searchTextDiscourseSpellings(spelling);
    const textNames = await Promise.all(searchRows.map((r) => aliasDao.displayAliasNames(r.textUuid)));
    const textReadings = await Promise.all(searchRows.map((r) => textDiscourseDao.getTextSpellings(r.textUuid)));

    const response: SearchDiscourseSpellingRow[] = searchRows.map((row, i) => ({
      line: row.line,
      textName: textNames[i],
      textUuid: row.textUuid,
      textReading: textReadings[i]
        .filter((tr) => tr.wordOnTablet >= row.wordOnTablet - 5 && tr.wordOnTablet <= row.wordOnTablet + 5)
        .map((tr) => tr.spelling)
        .join(' '),
    }));

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/search/spellings').get(async (req, res, next) => {
  try {
    const dictionaryWordDao = sl.get('DictionaryWordDao');
    const { spelling } = (req.query as unknown) as SearchSpellingPayload;

    const results = await dictionaryWordDao.searchSpellings(spelling);
    res.json(results);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/search').get(async (req, res, next) => {
  try {
    const textGroupDao = sl.get('TextGroupDao');
    const textEpigraphyDao = sl.get('TextEpigraphyDao');

    const { page, rows, textTitle, characters: charsPayload } = (req.query as unknown) as SearchTextsPayload;
    const characters = charsPayload || [];
    const user = req.user || null;

    const blacklist = await textGroupDao.getUserBlacklist(user);
    const totalRows = await textEpigraphyDao.totalSearchRows(characters, textTitle, blacklist);
    const texts = await textEpigraphyDao.searchTexts(characters, textTitle, blacklist, {
      page,
      rows,
    });

    const searchResults: SearchTextsResponse = {
      totalRows,
      results: texts,
    };

    cache.insert({ req }, searchResults);
    res.json(searchResults);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

import express from 'express';
import {
  SearchTextsResponse,
  SearchTextsPayload,
  SearchSpellingPayload,
  SearchDiscourseSpellingRow,
  SearchDiscourseSpellingResponse,
} from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/search/spellings/discourse').get(async (req, res, next) => {
  try {
    const textDiscourseDao = sl.get('TextDiscourseDao');

    const {
      spelling,
      page: queryPage,
      limit: queryLimit,
    } = (req.query as unknown) as SearchSpellingPayload;
    const limit = queryLimit ? Number(queryLimit) : 10;
    const page = queryPage ? Number(queryPage) : 1;

    const {
      rows: searchRows,
      totalResults,
    } = await textDiscourseDao.searchTextDiscourseSpellings(spelling, {
      page,
      limit,
    });

    const textReadings = await Promise.all(
      searchRows.map(r => textDiscourseDao.getTextSpellings(r.textUuid))
    );

    const rows: SearchDiscourseSpellingRow[] = searchRows.map((row, i) => ({
      uuid: row.uuid,
      line: row.line,
      wordOnTablet: row.wordOnTablet,
      textName: row.textName,
      textUuid: row.textUuid,
      readings: textReadings[i].filter(
        tr =>
          tr.wordOnTablet >= row.wordOnTablet - 5 &&
          tr.wordOnTablet <= row.wordOnTablet + 5
      ),
    }));

    const response: SearchDiscourseSpellingResponse = {
      rows,
      totalResults,
    };
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
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextDao = sl.get('TextDao');

    const {
      page,
      rows,
      textTitle: title,
      characters: charsPayload,
    } = (req.query as unknown) as SearchTextsPayload;
    const characters = charsPayload || [];
    const user = req.user || null;

    const totalRows = await TextEpigraphyDao.searchTextsTotal({
      characters,
      title,
    });

    const textMatches = await TextEpigraphyDao.searchTexts({
      characters,
      pagination: { limit: rows, page },
      title,
      userUuid: user ? user.uuid : null,
    });

    const texts = await Promise.all(
      textMatches.map(({ uuid }) => TextDao.getTextByUuid(uuid))
    );

    const lineReadings = await Promise.all(
      textMatches.map(({ uuid, lines }) =>
        Promise.all(
          lines.map(line =>
            TextEpigraphyDao.getMarkedUpLineReading(uuid, line, {
              lineNumbers: true,
              textFormat: 'html',
            })
          )
        )
      )
    );

    const response: SearchTextsResponse = {
      totalRows,
      results: textMatches.map((match, index) => ({
        ...match,
        name: texts[index].name,
        matches: lineReadings[index],
      })),
    };

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

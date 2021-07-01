import express from 'express';
import {
  SearchTextsResponse,
  SearchTextsCountPayload,
  SearchTextsPayload,
  SearchSpellingPayload,
  SearchDiscourseSpellingRow,
  SearchDiscourseSpellingResponse,
  SearchNullDiscourseResultRow,
  SearchNullDiscourseLine,
  SearchTextsResultRow,
} from '@oare/types';
import { createTabletRenderer } from '@oare/oare';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { prepareCharactersForSearch } from '@/api/daos/SignReadingDao/utils';
import { parsedQuery, extractPagination } from '@/utils';

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

router.route('/search/count').get(async (req, res, next) => {
  try {
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const SearchIndexDao = sl.get('SearchIndexDao');

    const {
      textTitle: title,
      characters: charsPayload,
    } = (req.query as unknown) as SearchTextsCountPayload;

    const characterOccurrences = await prepareCharactersForSearch(charsPayload);
    const user = req.user || null;

    const totalRows = await SearchIndexDao.getMatchingTextCount(
      characterOccurrences,
      title
    );

    res.json(totalRows);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/search').get(async (req, res, next) => {
  try {
    const SearchIndexDao = sl.get('SearchIndexDao');

    const {
      page,
      rows,
      textTitle: title,
      characters: charsPayload,
    } = (req.query as unknown) as SearchTextsPayload;

    const characterOccurrences = await prepareCharactersForSearch(charsPayload);
    const { user } = req;

    const textUuids = await SearchIndexDao.getMatchingTexts(
      characterOccurrences,
      title,
      { limit: rows, page }
    );

    const searchRows: SearchTextsResultRow[] = await Promise.all(
      textUuids.map(async ({ textUuid, textName }) => {
        const matches = await SearchIndexDao.getMatchingTextLines(
          characterOccurrences,
          textUuid
        );
        return {
          uuid: textUuid,
          name: textName,
          matches,
          discourseUuids: [],
        };
      })
    );

    res.json({
      results: searchRows,
    });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/search/discourse/null/count').get(async (req, res, next) => {
  try {
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const query = parsedQuery(req.originalUrl);
    const characters = query.get('characters') || '';
    const includeSuperfluous = query.get('includeSuperfluous') === 'true';

    const characterUuids = await prepareCharactersForSearch(characters);
    const userUuid = req.user ? req.user.uuid : null;

    const count: number = await TextEpigraphyDao.searchNullDiscourseCount(
      characterUuids,
      userUuid,
      includeSuperfluous
    );

    res.json(count);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/search/discourse/null').get(async (req, res, next) => {
  try {
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextDao = sl.get('TextDao');

    const query = parsedQuery(req.originalUrl);
    const characters = query.get('characters') || '';
    const includeSuperfluous = query.get('includeSuperfluous') === 'true';
    const { page, limit } = extractPagination(req.query);

    const characterUuids = await prepareCharactersForSearch(characters);
    const userUuid = req.user ? req.user.uuid : null;

    const matchingLines: SearchNullDiscourseLine[] = await TextEpigraphyDao.searchNullDiscourse(
      characterUuids,
      page,
      limit,
      userUuid,
      includeSuperfluous
    );

    const textNames = (
      await Promise.all(
        matchingLines.map(row => TextDao.getTextByUuid(row.textUuid))
      )
    ).map(text => (text ? text.name : ''));

    const lineReadings = await Promise.all(
      matchingLines.map(async ({ textUuid, line }) => {
        const epigraphicUnits = await TextEpigraphyDao.getEpigraphicUnits(
          textUuid
        );

        const renderer = createTabletRenderer(epigraphicUnits, {
          textFormat: 'html',
          lineNumbers: true,
          showNullDiscourse: true,
        });

        return renderer.lineReading(line);
      })
    );

    const response: SearchNullDiscourseResultRow[] = matchingLines.map(
      (occ, idx) => ({
        ...occ,
        textName: textNames[idx],
        reading: lineReadings[idx],
      })
    );
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;

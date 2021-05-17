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
  SearchNullDiscourseCountPayload,
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

    const {
      textTitle: title,
      characters: charsPayload,
    } = (req.query as unknown) as SearchTextsCountPayload;

    const characterUuids = await prepareCharactersForSearch(charsPayload);
    const user = req.user || null;

    const totalRows = await TextEpigraphyDao.searchTextsTotal({
      characters: characterUuids,
      title,
      userUuid: user ? user.uuid : null,
    });

    res.json(totalRows);
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

    const characterUuids = await prepareCharactersForSearch(charsPayload);
    const user = req.user || null;

    const textMatches = await TextEpigraphyDao.searchTexts({
      characters: characterUuids,
      pagination: { limit: rows, page },
      title,
      userUuid: user ? user.uuid : null,
    });

    const textNames = (
      await Promise.all(
        textMatches.map(({ uuid }) => TextDao.getTextByUuid(uuid))
      )
    ).map(text => (text ? text.name : ''));

    const lineReadings = await Promise.all(
      textMatches.map(async ({ uuid, lines }) => {
        const epigraphicUnits = await TextEpigraphyDao.getEpigraphicUnits(uuid);

        const renderer = createTabletRenderer(epigraphicUnits, {
          textFormat: 'html',
          lineNumbers: true,
        });

        return lines.map(line => renderer.lineReading(line));
      })
    );

    const response: SearchTextsResponse = {
      results: textMatches.map((match, index) => ({
        ...match,
        name: textNames[index],
        matches: lineReadings[index],
      })),
    };

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/search/discourse/null/count').get(async (req, res, next) => {
  try {
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const {
      characters,
    } = (req.query as unknown) as SearchNullDiscourseCountPayload;

    const characterUuids = await prepareCharactersForSearch(characters);
    const userUuid = req.user ? req.user.uuid : null;

    const count: number = await TextEpigraphyDao.searchNullDiscourseCount(
      characterUuids,
      userUuid
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
    const { page, limit } = extractPagination(req.query);

    const characterUuids = await prepareCharactersForSearch(characters);
    const userUuid = req.user ? req.user.uuid : null;

    const matchingLines: SearchNullDiscourseLine[] = await TextEpigraphyDao.searchNullDiscourse(
      characterUuids,
      page,
      limit,
      userUuid
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

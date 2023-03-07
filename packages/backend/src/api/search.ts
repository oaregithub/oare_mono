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
  SearchType,
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

    const wordsNum = 8;

    const rows: SearchDiscourseSpellingRow[] = searchRows.map((row, i) => ({
      uuid: row.uuid,
      line: row.line,
      wordOnTablet: row.wordOnTablet,
      textName: row.textName,
      textUuid: row.textUuid,
      readings: textReadings[i].filter(
        tr =>
          tr.wordOnTablet >= row.wordOnTablet - wordsNum &&
          tr.wordOnTablet <= row.wordOnTablet + wordsNum
      ),
    }));

    const response: SearchDiscourseSpellingResponse = {
      rows,
      totalResults,
    };
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/search/spellings').get(async (req, res, next) => {
  try {
    const dictionaryWordDao = sl.get('DictionaryWordDao');
    const userUuid = req.user ? req.user.uuid : null;
    const { spelling } = (req.query as unknown) as SearchSpellingPayload;

    const results = await dictionaryWordDao.searchSpellings(spelling, userUuid);
    res.json(results);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/search/count').get(async (req, res, next) => {
  try {
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const {
      textTitle: title,
      characters: charsPayload,
      mode,
    } = (req.query as unknown) as SearchTextsCountPayload;

    const characterUuids = await prepareCharactersForSearch(charsPayload);
    const user = req.user || null;

    const totalRows = await TextEpigraphyDao.searchTextsTotal({
      characters: characterUuids,
      title,
      userUuid: user ? user.uuid : null,
      mode,
    });

    res.json(totalRows);
  } catch (err) {
    next(new HttpInternalError(err as string));
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
      mode,
    } = (req.query as unknown) as SearchTextsPayload;

    // Allows for text search by UUID
    const textByUuid = await TextDao.getTextByUuid(title);
    if (textByUuid) {
      const response: SearchTextsResponse = {
        results: [
          {
            uuid: textByUuid.uuid,
            name: textByUuid.name,
            matches: [],
            discourseUuids: [],
          },
        ],
      };
      res.json(response);
      return;
    }

    const characterUuids = await prepareCharactersForSearch(charsPayload);
    const user = req.user || null;

    const textMatches = await TextEpigraphyDao.searchTexts({
      characters: characterUuids,
      pagination: { limit: rows, page },
      title,
      userUuid: user ? user.uuid : null,
      mode,
    });

    const textNames = (
      await Promise.all(
        textMatches.map(({ uuid }) => TextDao.getTextByUuid(uuid))
      )
    ).map(text => (text ? text.name : ''));

    const lineReadings = await Promise.all(
      textMatches.map(async ({ uuid, lines, discourseUuids }) => {
        const epigraphicUnits = await TextEpigraphyDao.getEpigraphicUnits(uuid);

        const renderer = createTabletRenderer(epigraphicUnits, req.locale, {
          textFormat: 'html',
          lineNumbers: true,
          highlightDiscourses: discourseUuids,
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

    if (response.results.length === 0) {
      const SearchFailureDao = sl.get('SearchFailureDao');
      let type: SearchType;
      let query: string;
      if (title && title !== '' && charsPayload && charsPayload !== '') {
        type = 'title+transliteration';
        query = `title: ${title}, transliteration: ${charsPayload}`;
      } else if (title && title !== '') {
        type = 'title';
        query = title;
      } else {
        type = 'transliteration';
        query = charsPayload || '';
      }

      const userUuid = user ? user.uuid : null;
      await SearchFailureDao.insertSearchFailure(type, query, userUuid);
    }

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
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
    next(new HttpInternalError(err as string));
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

        const renderer = createTabletRenderer(epigraphicUnits, req.locale, {
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
    next(new HttpInternalError(err as string));
  }
});

export default router;

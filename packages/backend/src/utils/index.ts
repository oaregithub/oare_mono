import { knexWrite } from '@/connection';
import { Knex } from 'knex';
import { ParsedQs } from 'qs';
import {
  Pagination,
  TextOccurrencesResponseRow,
  TextOccurrencesRow,
  ItemPropertyRowWithChildren,
  ItemPropertyRow,
  LocaleCode,
} from '@oare/types';
import { createTabletRenderer } from '@oare/oare';
import _ from 'lodash';
import sl from '@/serviceLocator';
import AWS from 'aws-sdk';

export const createTransaction = async (
  cb: (trx: Knex.Transaction) => Promise<void>
): Promise<void> => {
  await knexWrite().transaction(async trx => {
    await cb(trx);
  });
};

export interface ExtractPaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  defaultFilter?: string;
}

export const extractPagination = (
  query: ParsedQs,
  { defaultPage, defaultLimit, defaultFilter }: ExtractPaginationOptions = {}
): Required<Pagination> => {
  const page = query.page
    ? ((query.page as unknown) as number)
    : defaultPage || 1;
  const limit = query.limit
    ? ((query.limit as unknown) as number)
    : defaultLimit || 10;
  const filter = query.filter ? (query.filter as string) : defaultFilter || '';

  return {
    page,
    limit,
    filter,
  };
};

export const parsedQuery = (url: string): URLSearchParams => {
  const queryIndex = url.indexOf('?');
  const queryString = queryIndex > 0 ? url.slice(queryIndex + 1) : '';

  return new URLSearchParams(queryString);
};

export const getTextOccurrences = async (
  rows: TextOccurrencesRow[],
  locale: LocaleCode
): Promise<TextOccurrencesResponseRow[]> => {
  const TextEpigraphyDao = sl.get('TextEpigraphyDao');
  const TextDiscourseDao = sl.get('TextDiscourseDao');
  const epigraphicUnits = await Promise.all(
    rows.map(({ textUuid }) => TextEpigraphyDao.getEpigraphicUnits(textUuid))
  );

  const subwordDiscourseUuids = await Promise.all(
    rows.map(row =>
      TextDiscourseDao.getSubwordsByDiscourseUuid(row.discourseUuid)
    )
  );

  const lines = await Promise.all(
    subwordDiscourseUuids.map(async uuids => {
      const linesArray = (
        await Promise.all(
          uuids.map(uuid => TextEpigraphyDao.getLineByDiscourseUuid(uuid))
        )
      ).filter(line => line !== null) as number[];

      return [...new Set(linesArray)];
    })
  );

  const readings = rows.map((row, index) => {
    // Don't get renderings for full discourse units
    if (
      subwordDiscourseUuids[index].length === 0 ||
      lines[index].length === 0
    ) {
      return null;
    }

    const units = epigraphicUnits[index];

    const renderer = createTabletRenderer(units, locale, {
      lineNumbers: true,
      textFormat: 'html',
      highlightDiscourses: [...subwordDiscourseUuids[index]],
    });

    const linesList = renderer.lines;

    const sortedLines = lines[index].sort((a, b) => a - b);

    const firstLineIndex = linesList.indexOf(sortedLines[0]);
    const lastLineIndex = linesList.indexOf(
      sortedLines[sortedLines.length - 1]
    );

    const startIdx = firstLineIndex - 1 < 0 ? 0 : firstLineIndex - 1;
    const endIdx =
      lastLineIndex + 1 >= linesList.length
        ? linesList.length - 1
        : lastLineIndex + 1;

    return _.range(startIdx, endIdx + 1).map(idx =>
      renderer.lineReading(linesList[idx])
    );
  });

  return rows.map((r, index) => ({
    ...r,
    discourseUuidsToHighlight: [...subwordDiscourseUuids[index]],
    readings: readings[index],
  }));
};

export const nestProperties = (
  propertyRows: ItemPropertyRow[],
  parentUuid: string | null
): ItemPropertyRowWithChildren[] => {
  const children = propertyRows.filter(row => row.parentUuid === parentUuid);
  const props: ItemPropertyRowWithChildren[] = [];

  children.forEach(child => {
    const property = {
      ...child,
      children: nestProperties(propertyRows, child.uuid),
    };

    props.push(property);
  });

  return props;
};

const getDictionaryFirstLetter = (word: string): string => {
  const firstLetter = word.substring(0, 1).toUpperCase();
  switch (firstLetter) {
    case 'Ā':
      return 'A';
    case 'Ē':
      return 'E';
    case 'Ī':
      return 'I';
    case 'Õ':
      return 'O';
    case 'Ū':
      return 'U';
    default:
      return firstLetter;
  }
};

export const getDictionaryCacheRouteToClear = (
  word: string,
  type: 'word' | 'PN' | 'GN'
): string => {
  const firstLetter = getDictionaryFirstLetter(word);

  let cacheRouteToClear = '';
  switch (type) {
    case 'word':
      cacheRouteToClear = `/words/${firstLetter}`;
      break;
    case 'PN':
      cacheRouteToClear = `/names/${firstLetter}`;
      break;
    case 'GN':
      cacheRouteToClear = `/places/${firstLetter}`;
      break;
    default:
      cacheRouteToClear = `/words/${firstLetter}`;
      break;
  }

  return cacheRouteToClear;
};

export const getDetectLanguageAPIKEY = async (): Promise<string> => {
  const s3 = new AWS.S3();

  let apiKey = '';

  if (process.env.DETECT_LANGUAGE_API_KEY) {
    apiKey = process.env.DETECT_LANGUAGE_API_KEY;
  } else {
    const response = (
      await s3
        .getObject({
          Bucket: 'oare-resources',
          Key: 'detectlanguage_auth.json',
        })
        .promise()
    ).Body;
    if (response) {
      apiKey = JSON.parse(response as string).authKey;
      process.env.DETECT_LANGUAGE_API_KEY = apiKey;
    }
  }

  return apiKey;
};

import knex from '@/connection';
import { Knex } from 'knex';
import { ParsedQs } from 'qs';
import {
  Pagination,
  TextOccurrencesResponseRow,
  TextOccurrencesRow,
  LocaleCode,
  ZoteroResponse,
} from '@oare/types';
import { createTabletRenderer } from '@oare/oare';
import _ from 'lodash';
import sl from '@/serviceLocator';
import AWS from 'aws-sdk';
import axiosRetry from 'axios-retry';
import axios from 'axios';
import DetectLanguage, { DetectionResult } from 'detectlanguage';
import { languages } from './languages';

// FIXME make this a class as a singleton
// Perhaps this should be split into utils for various functions? Ex: Bib utils. Basically moving it out of dao stuff

/**
 * Creates a SQL transaction and passes it to the callback function.
 * If the callback function throws an error or returns a Promise that rejects, the transaction is rolled back.
 * If the callback function returns a Promise that resolves, the transaction is committed.
 * Should be used for all write queries.
 * @param cb The callback function to wrap the transaction around. Includes the `trx` object to pass to queries.
 */
export const createTransaction = async (
  cb: (trx: Knex.Transaction) => Promise<void>
): Promise<void> => {
  await knex.transaction(async trx => {
    await cb(trx);
  });
};

/**
 * Optional parameters for the `extractPagination` function.
 */
export interface ExtractPaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  defaultFilter?: string;
}

/**
 * Extracts pagination query parameters from the request query string.
 * @param query The request query string (`req.query`)
 * @param options Optional default parameters for the function
 * @returns
 */
export const extractPagination = (
  query: ParsedQs,
  { defaultPage, defaultLimit, defaultFilter }: ExtractPaginationOptions = {}
): Required<Pagination> => {
  const page = query.page ? Number(query.page as string) : defaultPage || 1;
  const limit = query.limit
    ? Number(query.limit as string)
    : defaultLimit || 10;
  const filter = query.filter ? (query.filter as string) : defaultFilter || '';

  return {
    page,
    limit,
    filter,
  };
};

/**
 * Extracts query parameters from the request query string.
 * @param url The original request URL (`req.originalUrl`)
 * @returns URLSearchParams object with the query parameters
 */
export const parsedQuery = (url: string): URLSearchParams => {
  const queryIndex = url.indexOf('?');
  const queryString = queryIndex > 0 ? url.slice(queryIndex + 1) : '';

  return new URLSearchParams(queryString);
};

// FIXME move to other utils
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

// FUXNE - move to DictionaryWordDao utils?
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

// FIXME move to DictionaryWordDao utils?
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

// FIXME - move to separate file?
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

// FIXME could be private if this were a class
/**
 * Retrieves the Zotero API key from the environment variables or from the S3 bucket.
 * If not previously set, it will be set in the environment variables for future use.
 * @returns The Zotero API key
 */
const getZoteroAPIKey = async (): Promise<string> => {
  let apiKey = '';

  if (process.env.ZOTERO_API_KEY) {
    apiKey = process.env.ZOTERO_API_KEY;
  } else {
    const s3 = new AWS.S3();

    const response = (
      await s3
        .getObject({
          Bucket: 'oare-resources',
          Key: 'zotero_auth.json',
        })
        .promise()
    ).Body;
    if (response) {
      apiKey = JSON.parse(response as string).authKey;
      process.env.ZOTERO_API_KEY = apiKey;
    }
  }

  return apiKey;
};

/**
 * Queries the Zotero API for the given citation style and key.
 * Used to support bibliography and citation generation.
 * @param zoteroKey The Zotero key for the item to retrieve.
 * @param citationStyle The citation style to use.
 * @returns Zotero API response.
 */
export const getZoteroData = async (
  zoteroKey: string,
  citationStyle: string
): Promise<ZoteroResponse | null> => {
  try {
    const zoteroAPIKey = await getZoteroAPIKey();

    // Used to prevent rate limit errors
    axiosRetry(axios, {
      retries: 3,
      retryDelay: retryCount => retryCount * 3000,
    });

    const { data }: { data: ZoteroResponse } = await axios.get(
      `https://api.zotero.org/groups/318265/items/${zoteroKey}?format=json&include=citation,bib,data&style=${citationStyle}`,
      {
        headers: {
          Authorization: `Bearer ${zoteroAPIKey}`,
        },
      }
    );

    return data;
  } catch (err) {
    const ErrorsDao = sl.get('ErrorsDao');
    await ErrorsDao.logError(
      null,
      'Error retrieving Zotero API data',
      JSON.stringify(err),
      'New'
    );
    return null;
  }
};

export const detectLanguage = async (text: string): Promise<string> => {
  const apiKey: string = await getDetectLanguageAPIKEY();
  const detectLanguageAPI = new DetectLanguage(apiKey);

  const language:
    | { code: string; name: string }
    | undefined = await detectLanguageAPI
    .detect(text)
    .then((results: DetectionResult[]) =>
      languages.find(lang => lang.code === results[0].language)
    );
  return language && language.name ? _.capitalize(language.name) : 'unknown';
};

export const getS3ObjectBody = async (
  bucket: string,
  key: string
): Promise<AWS.S3.Body | undefined> => {
  const s3 = new AWS.S3();

  const body = (
    await s3
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .promise()
  ).Body;

  return body;
};

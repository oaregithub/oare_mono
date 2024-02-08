import knex from '@/connection';
import { Knex } from 'knex';
import { ParsedQs } from 'qs';
import {
  Pagination,
  TextOccurrencesResponseRow,
  TextOccurrencesRow,
  LocaleCode,
} from '@oare/types';
import { createTabletRenderer } from '@oare/oare';
import _ from 'lodash';
import sl from '@/serviceLocator';
import AWS from 'aws-sdk';

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
 * Compiles TextOccurrencesResponseRow objects.
 * @param rows The original text occurrences rows,
 * @param locale The locale code to use for rendering the text.
 * @returns Array of TextOccurrencesResponseRow objects.
 */
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

/**
 * Extracts the body of an object in AWS S3.
 * @param bucket The S3 bucket name.
 * @param key The S3 object key.
 * @returns The body of the S3 object.
 */
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

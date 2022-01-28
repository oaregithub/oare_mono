import knex from '@/connection';
import Knex from 'knex';
import { ParsedQs } from 'qs';
import {
  Pagination,
  PersonOccurrenceRow,
  SpellingOccurrenceResponseRow,
  SpellingOccurrenceRow,
  ItemPropertyRowWithChildren,
  ItemPropertyRow,
} from '@oare/types';
import { createTabletRenderer } from '@oare/oare';
import _ from 'lodash';
import sl from '@/serviceLocator';

export const createTransaction = async (
  cb: (trx: Knex.Transaction) => Promise<void>
): Promise<void> => {
  await knex.transaction(async trx => {
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

export const getTextOccurrences = async <Type extends SpellingOccurrenceRow[]>(
  rows: Type,
  highlightAllDiscourseUuids = false
): Promise<SpellingOccurrenceResponseRow[]> => {
  const TextEpigraphyDao = sl.get('TextEpigraphyDao');
  const epigraphicUnits = await Promise.all(
    rows.map(({ textUuid }) => TextEpigraphyDao.getEpigraphicUnits(textUuid))
  );

  const readings = rows.map((row, index) => {
    const units = epigraphicUnits[index];

    const renderer = createTabletRenderer(units, {
      lineNumbers: true,
      textFormat: 'html',
      highlightDiscourses: highlightAllDiscourseUuids
        ? (row as PersonOccurrenceRow).discoursesToHighlight
        : [row.discourseUuid],
    });
    const linesList = renderer.lines;
    const lineIdx = linesList.indexOf(row.line);

    const startIdx = lineIdx - 1 < 0 ? 0 : lineIdx - 1;
    const endIdx =
      lineIdx + 1 >= linesList.length ? linesList.length - 1 : lineIdx + 1;

    return _.range(startIdx, endIdx + 1).map(idx =>
      renderer.lineReading(linesList[idx])
    );
  });

  return rows.map((r, index) => ({
    ...r,
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

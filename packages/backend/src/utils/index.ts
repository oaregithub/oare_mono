import knex from '@/connection';
import Knex from 'knex';
import { ParsedQs } from 'qs';
import { Pagination } from '@oare/types';

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
    : defaultPage || 0;
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

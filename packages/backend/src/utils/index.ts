import { Request } from 'express';
import knex from '@/connection';
import Knex from 'knex';
import { ParsedQs } from 'qs';
import { Pagination } from '@oare/types';
import { RefreshToken } from '../api/daos/RefreshTokenDao';

const createTransaction = async (
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

const extractPagination = (
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

const validateRefreshToken = (
  req: Request,
  token: RefreshToken | null
): void => {
  if (!token) {
    throw 'Invalid token';
  }

  if (req.ip !== token.ipAddress) {
    throw 'Invalid IP address';
  }

  if (Date.now() >= token.expiration.getTime()) {
    throw 'Refresh token is expired';
  }
};

export default {
  createTransaction,
  extractPagination,
  validateRefreshToken,
};

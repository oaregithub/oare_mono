import knex from '@/connection';
import Knex from 'knex';

const createTransaction = async (cb: (trx: Knex.Transaction) => Promise<void>): Promise<void> => {
  await knex.transaction(async (trx) => {
    await cb(trx);
  });
};

export default {
  createTransaction,
};

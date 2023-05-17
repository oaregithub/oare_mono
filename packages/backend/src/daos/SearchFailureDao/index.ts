import knex from '@/connection';
import { SearchType } from '@oare/types';
import { Knex } from 'knex';

class SearchFailureDao {
  async insertSearchFailure(
    type: SearchType,
    query: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;
    const timestamp = new Date();

    await k('search_failure').insert({
      user_uuid: userUuid,
      search_type: type,
      query_content: query,
      timestamp,
    });
  }
}

export default new SearchFailureDao();

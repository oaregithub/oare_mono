import knex from '@/connection';
import { SearchType } from '@oare/types';
import { Knex } from 'knex';

// COMPLETE

class SearchFailureDao {
  /**
   * Inserts a new row into the `search_failure` table. Used to track searches that returned no results.
   * @param type The type of the search.
   * @param query The query that was searched for.
   * @param userUuid The UUID of the user that performed the search.
   * @param trx Knex Transaction. Optional.
   */
  public async insertSearchFailure(
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

/**
 * SearchFailureDao instance as a singleton.
 */
export default new SearchFailureDao();

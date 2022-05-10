import { knexWrite } from '@/connection';
import { SearchType } from '@oare/types';

class SearchFailureDao {
  async insertSearchFailure(
    type: SearchType,
    query: string,
    userUuid: string | null
  ) {
    const timestamp = new Date();

    await knexWrite()('search_failure').insert({
      user_uuid: userUuid,
      search_type: type,
      query_content: query,
      timestamp,
    });
  }
}

export default new SearchFailureDao();

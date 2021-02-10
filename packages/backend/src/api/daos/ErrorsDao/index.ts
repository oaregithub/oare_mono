import knex from '@/connection';
import { ErrorsRow } from '@oare/types';

class ErrorsDao {
  async logError(error: ErrorsRow): Promise<void> {
    await knex('errors').insert(error);
  }

  async getErrorLog(page: number, limit: number): Promise<ErrorsRow[]> {
    const response: ErrorsRow[] = await knex('errors')
      .select('uuid', 'user_uuid', 'description', 'stacktrace', 'timestamp', 'status')
      .orderBy('errors.timestamp', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    return response;
  }
}

export default new ErrorsDao();

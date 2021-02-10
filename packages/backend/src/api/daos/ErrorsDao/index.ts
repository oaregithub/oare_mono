import knex from '@/connection';
import { ErrorsRow } from '@oare/types';

class ErrorsDao {
  async logError(error: ErrorsRow): Promise<void> {
    await knex('errors').insert(error);
  }
}

export default new ErrorsDao();

import { knexWrite } from '@/connection';
import { TreeRow } from '@oare/types';
import { Knex } from 'knex';

class TreeDao {
  async insertTreeRow(row: TreeRow, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knexWrite();
    await k('tree').insert(row);
  }
}

export default new TreeDao();

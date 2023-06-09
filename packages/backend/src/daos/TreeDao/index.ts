import knex from '@/connection';
import { TreeRow } from '@oare/types';
import { Knex } from 'knex';

// COMPLETE

class TreeDao {
  /**
   * Inserts a tree row into the database.
   * @param row The tree row to insert.
   * @param trx Knex Transaction. Optional.
   */
  async insertTreeRow(row: TreeRow, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;

    await k('tree').insert(row);
  }
}

export default new TreeDao();

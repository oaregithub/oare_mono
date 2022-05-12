import { knexWrite } from '@/connection';
import { TreeRow } from '@oare/types';

class TreeDao {
  async insertTreeRow(row: TreeRow): Promise<void> {
    await knexWrite()('tree').insert(row);
  }
}

export default new TreeDao();

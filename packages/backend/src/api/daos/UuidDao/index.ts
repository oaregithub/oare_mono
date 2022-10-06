import { knexRead, knexWrite } from '@/connection';
import { Knex } from 'knex';

class UuidDao {
  async haveSameTableReference(
    uuids: string[],
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knexRead();
    const tableReferences = await k('uuid')
      .pluck('table_reference')
      .whereIn('uuid', uuids);
    const uniqueTableReferences = [...new Set(tableReferences)];
    return uniqueTableReferences.length === 1;
  }
}

export default new UuidDao();

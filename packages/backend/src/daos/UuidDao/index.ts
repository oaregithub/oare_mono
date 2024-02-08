import { Knex } from 'knex';
import knex from '@/connection';

class UuidDao {
  /**
   * Retrieves the table reference for a given UUID.
   * @param uuid The UUID to retrieve the table reference for.
   * @param trx Knex Transaction. Optional.
   * @returns The table reference for the given UUID.
   * @throws Error if no table reference is found for the given UUID.
   */
  public async getTableReferenceByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const tableReference: string | null = await k('uuid')
      .select('table_reference as tableReference')
      .where({ uuid })
      .first()
      .then(row => (row ? row.tableReference : null));

    if (!tableReference) {
      throw new Error(`No table reference found for UUID ${uuid}`);
    }

    return tableReference;
  }
}

/**
 * UuidDao instance as a singleton.
 */
export default new UuidDao();

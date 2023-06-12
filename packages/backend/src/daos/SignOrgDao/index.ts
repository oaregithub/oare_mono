import knex from '@/connection';
import { Knex } from 'knex';
import { SignOrgRow } from '@oare/types';

// COMPLETE

class SignOrgDao {
  /**
   * Retrieves all rows from the `sign_org` table by reference UUID.
   * @param referenceUuid The reference UUID of the rows to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of rows from the `sign_org` table.
   */
  public async getSignOrgsRowByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<SignOrgRow[]> {
    const k = trx || knex;

    const signOrgRows: SignOrgRow[] = await k('sign_org')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'type',
        'org_num as orgNum',
        'has_png as hasPNG'
      )
      .where({ reference_uuid: referenceUuid })
      .then(rows => rows.map(r => ({ ...r, hasPNG: !!r.hasPNG })));

    return signOrgRows;
  }
}

/**
 * SignOrgDao instance as a singleton.
 */
export default new SignOrgDao();

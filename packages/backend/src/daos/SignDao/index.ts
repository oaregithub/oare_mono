import knex from '@/connection';
import { SignRow, Sign } from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

// COMPLETE

class SignDao {
  /**
   * Constructs a complete Sign object for the given UUID.
   * @param uuid The UUID of the sign to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A complete Sign object.
   * @throws Error if the sign does not exist.
   */
  public async getSignByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Sign> {
    const SignReadingDao = sl.get('SignReadingDao');
    const SignOrgDao = sl.get('SignOrgDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const signRow = await this.getSignRowByUuid(uuid, trx);
    const signOrgRows = await SignOrgDao.getSignOrgsRowByReferenceUuid(
      uuid,
      trx
    );
    const signReadingRows = await SignReadingDao.getSignReadingRowsByReferenceUuid(
      uuid,
      trx
    );

    const signReadingOccurrences: number[] = await Promise.all(
      signReadingRows.map(r =>
        TextEpigraphyDao.getSignReadingOccurrencesCount(r.uuid, trx)
      )
    );

    const occurrences = await TextEpigraphyDao.getSignOccurrencesCount(
      uuid,
      trx
    );

    const sign: Sign = {
      ...signRow,
      occurrences,
      orgs: signOrgRows,
      readings: signReadingRows.map((r, idx) => ({
        ...r,
        occurrences: signReadingOccurrences[idx],
      })),
    };

    return sign;
  }

  /**
   * Checks if a sign exists.
   * @param uuid The UUID of the sign to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the sign exists.
   */
  public async signExists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const sign = await k('sign').first().where({ uuid });

    return !!sign;
  }

  /**
   * Retrieves a list of all sign uuids.
   * @param trx Knex Transaction. Optional.
   * @returns Array of sign uuids.
   */
  public async getAllSignUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('sign').pluck('uuid');

    return uuids;
  }

  /**
   * Retrieves a row from the `sign` table by UUID.
   * @param uuid The UUID of the sign to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A row from the `sign` table.
   * @throws Error if the sign row does not exist.
   */
  private async getSignRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<SignRow> {
    const k = trx || knex;

    const row: SignRow | undefined = await k('sign')
      .select('uuid', 'name', 'font_code as fontCode')
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`Sign with uuid ${uuid} does not exist`);
    }

    return row;
  }
}

/**
 * SignDao instance as a singleton.
 */
export default new SignDao();

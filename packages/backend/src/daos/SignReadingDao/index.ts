import knex from '@/connection';
import { SignRow, SignOrgRow, SignReadingRow, Sign } from '@oare/types';
import { Knex } from 'knex';

// FIXME should probably be split into 3 separate daos

class SignReadingDao {
  /**
   * Checks if a sign reading exists
   * @param reading The sign reading to check
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the sign reading exists
   */
  async isValidReading(
    reading: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const row = await k('sign_reading').where({ reading }).first();

    return !!row;
  }

  // FIXME OUTDATED
  /**
   * Gets all valid sign uuids from array of possible intellisearch signs
   * @param signs array of all possible signs from intellisearch query
   * @returns sign uuids for valid signs found in the array of possible signs
   */
  async getIntellisearchSignUuids(
    signs: string[],
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows: string[] = await k('sign_reading')
      .pluck('uuid')
      .whereIn('reading', signs);

    return rows;
  }

  // FIXME don't yet know what this does so can't document
  async getMatchingSigns(
    sign: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const matchingSigns: string[] = await k('sign_reading AS sr1')
      .pluck('sr2.reading')
      .innerJoin(
        'sign_reading AS sr2',
        'sr1.reference_uuid',
        'sr2.reference_uuid'
      )
      .where('sr1.reading', sign);

    return matchingSigns;
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
   */
  private async getSignRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<SignRow> {
    const k = trx || knex;

    const row: SignRow = await k('sign')
      .select('uuid', 'name', 'font_code as fontCode')
      .where({ uuid })
      .first();

    return row;
  }

  /**
   * Retrieves all rows from the `sign_org` table by reference UUID.
   * @param referenceUuid The reference UUID of the rows to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of rows from the `sign_org` table.
   */
  private async getSignOrgsRowByReferenceUuid(
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

  /**
   * Retrieves all rows from the `sign_reading` table by reference UUID.
   * @param referenceUuid The reference UUID of the rows to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of rows from the `sign_reading` table.
   */
  private async getSignReadingRowsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<SignReadingRow[]> {
    const k = trx || knex;

    const rows: SignReadingRow[] = await k('sign_reading')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'type',
        'num_name as numName',
        'reading',
        'value',
        'frequency'
      )
      .where({ reference_uuid: referenceUuid });

    return rows;
  }

  /**
   * Gets the number of occurrences of a sign in the text_epigraphy table.
   * @param uuid The UUID of the sign to get the occurrences for.
   * @param trx Knex Transaction. Optional.
   * @returns A number indicating the number of occurrences of the sign.
   */
  private async getSignOccurrencesCount(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;

    const count: number = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .where({ sign_uuid: uuid })
      .first()
      .then(row => (row && row.count ? Number(row.count) : 0));

    return count;
  }

  /**
   * Gets the number of occurrences of a sign reading in the text_epigraphy table.
   * @param uuid The UUID of the sign reading to get the occurrences for.
   * @param trx Knex Transaction. Optional.
   * @returns A number indicating the number of occurrences of the sign reading.
   */
  private async getSignReadingOccurrencesCount(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;

    const count: number = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .where({ reading_uuid: uuid })
      .first()
      .then(row => (row && row.count ? Number(row.count) : 0));

    return count;
  }

  /**
   * Constructs a complete Sign object for the given UUID.
   * @param uuid The UUID of the sign to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A complete Sign object.
   */
  public async getSignByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Sign> {
    const signRow = await this.getSignRowByUuid(uuid, trx);
    const signOrgRows = await this.getSignOrgsRowByReferenceUuid(uuid, trx);
    const signReadingRows = await this.getSignReadingRowsByReferenceUuid(
      uuid,
      trx
    );

    const signReadingOccurrences: number[] = await Promise.all(
      signReadingRows.map(r => this.getSignReadingOccurrencesCount(r.uuid, trx))
    );

    const occurrences = await this.getSignOccurrencesCount(uuid, trx);

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
   * Retrieves a sign UUID by one of its readings.
   * @param reading The reading to retrieve the sign UUID for.
   * @param trx Knex Transaction. Optional.
   * @returns The UUID of the sign that the reading belongs to.
   */
  private async getSignUuidByReading(
    reading: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const uuid: string = await k('sign_reading')
      .select('reference_uuid as referenceUuid')
      .where({ reading })
      .first()
      .then(row => row.referenceUuid);

    return uuid;
  }

  /**
   * Constructs a complete Sign object for the given reading.
   * @param reading The reading to retrieve the sign for.
   * @param trx Knex Transaction. Optional.
   * @returns A complete Sign object.
   */
  public async getSignByReading(
    reading: string,
    trx?: Knex.Transaction
  ): Promise<Sign> {
    const signUuid = await this.getSignUuidByReading(reading, trx);

    const sign = await this.getSignByUuid(signUuid, trx);

    return sign;
  }

  /**
   * Retrieves a sign reading UUID by reading and determinative status.
   * @param reading The reading to retrieve the sign reading UUID for.
   * @param isDeterminative Boolean indicating whether the reading is determinative.
   * @param trx Knex Transaction. Optional.
   * @returns The UUID of the sign reading.
   */
  public async getSignReadingUuidByReading(
    reading: string,
    isDeterminative: boolean,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const uuid = await k('sign_reading')
      .select('uuid')
      .where({ reading })
      .whereNot('type', 'uninterpreted')
      .modify(qb => {
        if (isDeterminative) {
          qb.where('sign_reading.type', 'determinative');
        } else {
          qb.whereNot('sign_reading.type', 'determinative');
        }
      })
      .first()
      .then(row => row.uuid);

    return uuid;
  }
}

/**
 * SignReadingDao instance as a singleton.
 */
export default new SignReadingDao();

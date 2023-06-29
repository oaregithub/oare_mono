import knex from '@/connection';
import { SignReadingRow, Sign, SignReading } from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

// COMPLETE

class SignReadingDao {
  /**
   * Checks if a sign reading exists
   * @param reading The sign reading to check
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the sign reading exists
   */
  public async isValidReading(
    reading: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const row = await k('sign_reading').where({ reading }).first();

    return !!row;
  }

  /**
   * Gets all valid sign reading uuids from array of possible sign readings.
   * Some of the provided sign readings may not be valid sign readings.
   * @param signs Array of all possible sign readings from query.
   * @returns Sign reading uuids for valid signs readings found in the array of possible sign readings.
   */
  public async getValidSignReadingUuidsByPossibleReadings(
    signs: string[],
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows: string[] = await k('sign_reading')
      .pluck('uuid')
      .whereIn('reading', signs);

    return rows;
  }

  /**
   * Retrieves a list of alternate sign readings.
   * These are all sign readings that reference the same sign as the provided sign reading.
   * @param reading The sign reading to get alternate sign readings for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of alternate sign readings.
   */
  public async getAlternateSignReadings(
    reading: string,
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
      .where('sr1.reading', reading);

    return matchingSigns;
  }

  /**
   * Retrieves a list of sign reading UUIDs for a given reference UUID.
   * @param referenceUuid The reference UUID to retrieve sign reading UUIDs for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of sign reading UUIDs.
   */
  public async getSignReadingUuidsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('sign_reading')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid });

    return uuids;
  }

  /**
   * Retrieves a single sign reading row by UUID.
   * @param uuid The UUID of the sign reading row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single sign reading row.
   */
  public async getSignReadingRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<SignReadingRow> {
    const k = trx || knex;

    const row: SignReadingRow | undefined = await k('sign_reading')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'type',
        'num_name as numName',
        'reading',
        'value',
        'frequency'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`Sign reading with uuid ${uuid} does not exist.`);
    }

    return row;
  }

  /**
   * Constructs a sign reading object for a given sign reading UUID.
   * @param uuid The UUID of the sign reading to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A sign reading object.
   */
  public async getSignReadingByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<SignReading> {
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const row = await this.getSignReadingRowByUuid(uuid, trx);

    const occurrences = await TextEpigraphyDao.getSignReadingOccurrencesCount(
      uuid,
      trx
    );

    return {
      ...row,
      occurrences,
    };
  }

  /**
   * Retrieves a sign UUID by one of its readings.
   * @param reading The reading to retrieve the sign UUID for.
   * @param trx Knex Transaction. Optional.
   * @returns The UUID of the sign that the reading belongs to.
   * @throws Error if the reading does not exist on any sign.
   */
  private async getSignUuidByReading(
    reading: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const row: { referenceUuid: string } | undefined = await k('sign_reading')
      .select('reference_uuid as referenceUuid')
      .where({ reading })
      .first();

    if (!row) {
      throw new Error(`Reading ${reading} does not exist on any sign.`);
    }

    return row.referenceUuid;
  }

  /**
   * Checks if a sign reading exists.
   * @param reading The sign reading to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the sign reading exists.
   */
  public async signReadingExists(
    reading: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const exists = await k('sign_reading').where({ reading }).first();

    return !!exists;
  }

  /**
   * Constructs a complete Sign object for the given reading.
   * @param reading The reading to retrieve the sign for.
   * @param trx Knex Transaction. Optional.
   * @returns A complete Sign object.
   * @throws Error if the reading does not exist on any sign or if the sign does not exist.
   */
  public async getSignByReading(
    reading: string,
    trx?: Knex.Transaction
  ): Promise<Sign> {
    const SignDao = sl.get('SignDao');

    const signUuid = await this.getSignUuidByReading(reading, trx);

    const sign = await SignDao.getSignByUuid(signUuid, trx);

    return sign;
  }

  /**
   * Retrieves a sign reading UUID by reading and determinative status.
   * @param reading The reading to retrieve the sign reading UUID for.
   * @param isDeterminative Boolean indicating whether the reading is determinative.
   * @param trx Knex Transaction. Optional.
   * @returns The UUID of the sign reading.
   * @throws Error if the reading does not exist.
   */
  public async getSignReadingUuidByReading(
    reading: string,
    isDeterminative: boolean,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const row: { uuid: string } | undefined = await k('sign_reading')
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
      .first();

    if (!row) {
      throw new Error(`Reading ${reading} does not exist`);
    }

    return row.uuid;
  }
}

/**
 * SignReadingDao instance as a singleton.
 */
export default new SignReadingDao();

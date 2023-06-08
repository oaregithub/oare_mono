import { Knex } from 'knex';
import knex from '@/connection';
import { QuarantineTextRow } from '@oare/types';

class QuarantineTextDao {
  /**
   * Quarantines a text by inserting a row into the quarantine_text table.
   * @param textUuid The UUID of the text to quarantine.
   * @param trx Knex Transaction. Optional.
   */
  public async quarantineText(textUuid: string, trx?: Knex.Transaction) {
    const k = trx || knex;

    await k('quarantine_text').insert({
      reference_uuid: textUuid,
      timestamp: new Date(),
    });
  }

  /**
   * Checks if a text is quarantined.
   * @param textUuid The UUID of the text to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the text is quarantined.
   */
  public async textIsQuarantined(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const row = await k('quarantine_text')
      .where({ reference_uuid: textUuid })
      .first();

    return !!row;
  }

  /**
   * Retrieves a list of all quarantined text UUIDs.
   * @param trx Knex Transaction. Optional.
   * @returns Array of quarantined text UUIDs.
   */
  public async getAllQuarantinedTextUuids(
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows: string[] = await k('quarantine_text').pluck('reference_uuid');

    return rows;
  }

  /**
   * Retrieves a single quarantined text row by reference UUID.
   * @param referenceUuid
   * @param trx
   * @returns
   */
  public async getQuarantineTextRowByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<QuarantineTextRow> {
    const k = trx || knex;

    const row = await k('quarantine_text')
      .select('reference_uuid as referenceUuid', 'timestamp')
      .where({ reference_uuid: referenceUuid })
      .first();

    return row;
  }

  /**
   * Un-quarantines a text by removing the row from the quarantine_text table.
   * @param textUuid The UUID of the text to un-quarantine.
   * @param trx Knex Transaction. Optional.
   */
  public async removeQuarantineTextRow(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('quarantine_text').del().where({ reference_uuid: textUuid });
  }
}

/**
 * QuarantineTextDao instance as a singleton.
 */
export default new QuarantineTextDao();

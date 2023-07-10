import knex from '@/connection';
import { TextMarkupRow } from '@oare/types';
import { Knex } from 'knex';

class TextMarkupDao {
  /**
   * Retrievs a list of text markup UUIDs for a given reference UUID.
   * @param referenceUuid The reference UUID to retrieve text markup UUIDs for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of text markup UUIDs.
   */
  public async getTextMarkupUuidsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('text_markup')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid });

    return uuids;
  }

  /**
   * Retrievs a single text markup row by UUID.
   * @param uuid The UUID of the text markup row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single text markup row.
   */
  public async getTextMarkupRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<TextMarkupRow> {
    const k = trx || knex;

    const row: TextMarkupRow | undefined = await k('text_markup')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'type',
        'num_value as numValue',
        'alt_reading_uuid as altReadingUuid',
        'alt_reading as altReading',
        'start_char as startChar',
        'end_char as endChar',
        'obj_uuid as objectUuid'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`No text markup row with uuid ${uuid}`);
    }

    return row;
  }

  /**
   * Inserts a text markup row into the database.
   * @param row The text markup row to insert.
   * @param trx Knex Transaction. Optional.
   */
  public async insertMarkupRow(row: TextMarkupRow, trx?: Knex.Transaction) {
    const k = trx || knex;

    await k('text_markup').insert({
      uuid: row.uuid,
      reference_uuid: row.referenceUuid,
      type: row.type,
      num_value: row.numValue,
      alt_reading_uuid: row.altReadingUuid,
      alt_reading: row.altReading,
      start_char: row.startChar,
      end_char: row.endChar,
      obj_uuid: row.objectUuid,
    });
  }
}

/**
 * TextMarkupDao instance as a singleton.
 */
export default new TextMarkupDao();

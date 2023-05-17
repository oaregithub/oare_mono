import { Knex } from 'knex';
import knex from '@/connection';

class QuarantineTextDao {
  async quarantineText(textUuid: string, trx?: Knex.Transaction) {
    const k = trx || knex;
    await k('quarantine_text').insert({
      reference_uuid: textUuid,
      timestamp: new Date(),
    });
  }

  async textIsQuarantined(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;
    const row = await k('quarantine_text')
      .where({ reference_uuid: textUuid })
      .first();
    return !!row;
  }

  async getQuarantinedTextUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;
    const rows: string[] = await k('quarantine_text').pluck('reference_uuid');
    return rows;
  }

  async getQuarantinedTextRows(
    trx?: Knex.Transaction
  ): Promise<{ uuid: string; timestamp: string }[]> {
    const k = trx || knex;
    const rows = await k('quarantine_text').select(
      'reference_uuid as uuid',
      'timestamp'
    );
    return rows;
  }

  async removeQuarantineTextRow(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('quarantine_text').del().where({ reference_uuid: textUuid });
  }
}

export default new QuarantineTextDao();

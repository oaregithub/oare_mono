import knex from '@/connection';
import { UuidRow } from '@oare/types';

class SignReadingDao {
  async hasSign(sign: string): Promise<boolean> {
    const row = await knex('sign_reading').where('reading', sign).first();
    return !!row;
  }

  async getUuidsBySign(sign: string): Promise<string[]> {
    const rows: UuidRow[] = await knex('sign_reading')
      .select('uuid')
      .where('reading', sign);
    return rows.map(row => row.uuid);
  }

  /**
   * Gets all valid sign uuids from array of possible intellisearch signs
   * @param signs array of all possible signs from intellisearch query
   * @returns sign uuids for valid signs found in the array of possible signs
   */
  async getIntellisearchSignUuids(signs: string[]): Promise<string[]> {
    const rows: UuidRow[] = await knex('sign_reading')
      .select('uuid')
      .whereIn('reading', signs);
    return rows.map(row => row.uuid);
  }

  async getMatchingSigns(sign: string): Promise<string[]> {
    const matchingSigns = await knex('sign_reading AS sr1')
      .select('sr2.reading')
      .innerJoin(
        'sign_reading AS sr2',
        'sr1.reference_uuid',
        'sr2.reference_uuid'
      )
      .where('sr1.reading', sign);
    return matchingSigns.map(row => row.reading);
  }
}

export default new SignReadingDao();

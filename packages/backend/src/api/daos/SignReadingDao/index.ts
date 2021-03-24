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

  async getUuidsBySignArray(signs: string[]): Promise<string[]> {
    const rows: UuidRow[] = await knex('sign_reading')
      .select('uuid')
      .whereIn('reading', signs);
    return rows.map(row => row.uuid);
  }
}

export default new SignReadingDao();

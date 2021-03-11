import knex from '@/connection';

class SignReadingDao {
  async hasSign(sign: string): Promise<boolean> {
    const row = await knex('sign_reading').where('reading', sign).first();
    return !!row;
  }

  async getUuidBySign(sign: string): Promise<string> {
    const row = await knex('sign_reading')
      .select('uuid')
      .where('reading', sign)
      .first();
    return row.uuid;
  }
}

export default new SignReadingDao();

import knex from '@/connection';

class SignReadingDao {
  async hasSign(sign: string): Promise<boolean> {
    const row = await knex('sign_reading').where('reading', sign).first();
    return !!row;
  }
}

export default new SignReadingDao();

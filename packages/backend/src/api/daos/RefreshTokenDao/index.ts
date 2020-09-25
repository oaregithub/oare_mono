import knex from '../../../connection';

export interface RefreshTokenRow {
  id: number;
  token: string;
  expiration: string;
  ipAddress: string;
  email: string;
}

class RefreshTokenDao {
  async getTokenInfo(token: string) {
    const row: RefreshTokenRow = await knex('refresh_tokens')
      .select('id', 'token', 'expiration', 'ip_address AS ipAddress', 'email')
      .first()
      .where({ token });
    return row;
  }

  async insertToken(token: string, expiration: Date, email: string, ipAddress: string) {
    await knex('refresh_tokens').where({ email }).del();
    return knex('refresh_tokens').insert({
      token,
      expiration,
      ip_address: ipAddress,
      email,
    });
  }
}

export default new RefreshTokenDao();

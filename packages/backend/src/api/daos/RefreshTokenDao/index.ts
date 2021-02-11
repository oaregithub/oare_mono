import knex from '@/connection';

export interface RefreshTokenRow {
  id: number;
  token: string;
  expiration: string;
  ipAddress: string;
  email: string;
}

export interface RefreshToken {
  id: number;
  token: string;
  expiration: Date;
  ipAddress: string;
  email: string;
}

class RefreshTokenDao {
  async getTokenInfo(token: string): Promise<RefreshToken | null> {
    const row: RefreshTokenRow | null = await knex('refresh_tokens')
      .select('id', 'token', 'expiration', 'ip_address AS ipAddress', 'email')
      .first()
      .where({ token });

    if (!row) {
      return null;
    }

    return {
      ...row,
      expiration: new Date(row.expiration),
    };
  }

  async insertToken(
    token: string,
    expiration: Date,
    email: string,
    ipAddress: string
  ) {
    await this.deleteToken(email, ipAddress);
    return knex('refresh_tokens').insert({
      token,
      expiration,
      ip_address: ipAddress,
      email,
    });
  }

  async deleteToken(email: string, ipAddress: string) {
    await knex('refresh_tokens').where({ email, ip_address: ipAddress }).del();
  }
}

export default new RefreshTokenDao();

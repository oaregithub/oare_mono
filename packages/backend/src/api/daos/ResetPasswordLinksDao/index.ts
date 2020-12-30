import knex from '@/connection';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

class ResetPasswordLinksDao {
  async createResetPasswordLink(userUuid: string): Promise<string> {
    const uuid = v4();
    const expiration = DateTime.local().plus({ minutes: 30 }).toJSDate();

    await knex('reset_password_links').insert({
      uuid,
      user_uuid: userUuid,
      expiration,
    });

    return uuid;
  }
}

export default new ResetPasswordLinksDao();

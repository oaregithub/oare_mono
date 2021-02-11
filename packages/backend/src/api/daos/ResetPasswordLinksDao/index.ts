import knex from '@/connection';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { Transaction } from 'knex';

interface ResetPasswordBase {
  uuid: string;
  userUuid: string;
}

interface ResetPasswordQueryRow extends ResetPasswordBase {
  expiration: string;
}

export interface ResetPasswordRow extends ResetPasswordBase {
  expiration: Date;
}

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

  async getResetPasswordRow(uuid: string): Promise<ResetPasswordRow | null> {
    const row: ResetPasswordQueryRow | null = await knex('reset_password_links')
      .select('uuid', 'user_uuid AS userUuid', 'expiration')
      .where({ uuid })
      .first();

    if (!row) {
      return null;
    }

    return {
      ...row,
      expiration: new Date(row.expiration),
    };
  }

  async invalidateResetRow(uuid: string, trx?: Transaction): Promise<void> {
    const k = trx || knex;
    await k('reset_password_links')
      .update({ expiration: new Date() })
      .where({ uuid });
  }
}

export default new ResetPasswordLinksDao();

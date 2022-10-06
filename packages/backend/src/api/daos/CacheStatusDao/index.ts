import { knexRead, knexWrite } from '@/connection';
import { Knex } from 'knex';

export interface CacheStatusRow {
  disableExpires: Date;
}

class CacheStatusDao {
  async cacheIsEnabled(trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knexRead();
    const row: CacheStatusRow = await k('cache_status')
      .select('disable_expires AS disableExpires')
      .first();
    const isEnabled = row.disableExpires < new Date();
    return isEnabled;
  }

  async disableCache(trx?: Knex.Transaction): Promise<void> {
    const k = trx || knexWrite();
    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 mins
    const updateRow = {
      disable_expires: expires,
    };
    await k('cache_status').update(updateRow);
  }

  async enableCache(trx?: Knex.Transaction): Promise<void> {
    const k = trx || knexWrite();
    const updateRow = {
      disable_expires: new Date(),
    };
    await k('cache_status').update(updateRow);
  }
}

export default new CacheStatusDao();

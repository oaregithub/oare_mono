import knex from '@/connection';
import { Knex } from 'knex';

interface CacheStatusRow {
  disableExpires: Date;
}

// FIXME - probably a better way to accomplish this than this table

class CacheStatusDao {
  /**
   * Checks if the cache is currently enabled
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating if the cache is enabled
   */
  async cacheIsEnabled(trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;

    const row: CacheStatusRow = await k('cache_status')
      .select('disable_expires AS disableExpires')
      .first();

    const isEnabled = row.disableExpires < new Date();

    return isEnabled;
  }

  /**
   * Disables the cache for 10 minutes.
   * @param trx Knex Transaction. Optional.
   */
  async disableCache(trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;

    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 mins
    await k('cache_status').update({
      disable_expires: expires,
    });
  }

  /**
   * Enables the cache.
   * @param trx Knex Transaction. Optional.
   */
  async enableCache(trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;

    await k('cache_status').update({
      disable_expires: new Date(),
    });
  }
}

/**
 * CacheStatusDao instance as as singleton
 */
export default new CacheStatusDao();
